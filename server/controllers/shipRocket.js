import redisClient from "../config/redisClient.js";
import dotenv from "dotenv";
dotenv.config();

const SHIPROCKET_API_URL = "https://apiv2.shiprocket.in/v1/external";

/**
 * @desc    Internal helper to authenticate with Shiprocket
 */
const authenticate = async () => {
    try {
        const email = process.env.SHIPROCKET_EMAIL;
        const password = process.env.SHIPROCKET_PASSWORD;

        if (!email || !password) {
            console.error("Shiprocket credentials not found in environment variables");
            return null;
        }

        console.log(`Attempting Shiprocket login for: ${email} via ${SHIPROCKET_API_URL}`);

        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        };

        let response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ email, password })
        });

        // Fallback for 403 Forbidden (Try apiv2 endpoint)
        if (response.status === 403) {
            console.warn("403 Forbidden on api.shiprocket.in, trying apiv2.shiprocket.in...");
            const ALT_URL = "https://apiv2.shiprocket.in/v1/external";
            response = await fetch(`${ALT_URL}/auth/login`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ email, password })
            });
        }

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Shiprocket HTTP Error: ${response.status} ${response.statusText}`);
            console.error(`Response Type: ${contentType}`);
            console.error("Response body snippet:", errorText.substring(0, 300));
            return null;
        }

        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (data.token) {
                console.log("Shiprocket authenticated successfully");
                // Store token in Redis with an expiry (Shiprocket tokens usually last 24h/10 days)
                await redisClient.setEx("shiprocket_token", 86400, data.token);
                return data.token;
            } else {
                console.error("Shiprocket login failed (JSON):", data);
                return null;
            }
        } else {
            const text = await response.text();
            console.error("Shiprocket returned non-JSON response. Check API user permissions.");
            console.error("Response snippet:", text.substring(0, 300));
            return null;
        }
    } catch (error) {
        console.error("Internal Shiprocket Login Error:", error);
        return null;
    }
};

/**
 * @desc    Get a valid token from Redis or trigger an auto-login
 */
export const getShiprocketToken = async () => {
    try {
        let token = await redisClient.get("shiprocket_token");
        if (!token) {
            console.log("Shiprocket token missing in Redis, performing auto-login...");
            token = await authenticate();
        }
        return token;
    } catch (error) {
        console.error("Error getting Shiprocket token:", error);
        return null;
    }
};

/**
 * @desc    Internal helper to create a Shiprocket order from an Order document
 */
export const createShiprocketOrderInternal = async (order) => {
    try {
        const token = await getShiprocketToken();
        if (!token) {
            throw new Error("Shiprocket authentication failed");
        }

        // Prepare order items
        const orderItems = order.cartItems.map(item => {
            const product = item.product;
            const sizeInfo = product.sizes.find(s => s.size === item.size) || product.sizes[0];

            return {
                name: product.name,
                sku: `${product._id}-${item.size || 'default'}`,
                units: item.quantity,
                selling_price: sizeInfo ? sizeInfo.price : 0,
                discount: 0,
                tax: 0,
                hsn: ""
            };
        });

        // Use first product's weight or default if missing
        // Shiprocket expects weight in KG
        const totalWeight = order.cartItems.reduce((acc, item) => {
            const sizeInfo = item.product.sizes.find(s => s.size === item.size) || item.product.sizes[0];
            const weightValue = parseFloat(sizeInfo?.weight) || 0.5; // Default 0.5kg
            return acc + (weightValue * item.quantity);
        }, 0);

        const customer = order.user;
        const userAddress = customer.address || {};

        // Extract city, state, pincode from user address or default from order string
        const billingAddress = userAddress.street || order.address || "No address provided";
        const billingCity = userAddress.city || "Unknown";
        const billingState = userAddress.state || "Unknown";
        const billingPincode = userAddress.zipcode || "000000";

        const payload = {
            order_id: order._id.toString(),
            order_date: new Date(order.createdAt).toISOString().split('T')[0],
            pickup_location: "Home",
            billing_customer_name: customer.FirstName,
            billing_last_name: customer.LastName,
            billing_address: billingAddress,
            billing_address_2: "",
            billing_city: billingCity,
            billing_pincode: billingPincode,
            billing_state: billingState,
            billing_country: userAddress.country || "India",
            billing_email: customer.Email,
            billing_phone: customer.PhoneNumber,
            shipping_is_billing: true,
            order_items: orderItems,
            payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
            sub_total: order.totalPrice,
            length: 10,
            breadth: 10,
            height: 10,
            weight: totalWeight / 1000 || 0.5
        };

        const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            body: JSON.stringify(payload)
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            console.log("Shiprocket Order Creation Response:", data);
            return data;
        } else {
            const text = await response.text();
            console.error("Shiprocket Order Creation Error (Non-JSON):", text);
            throw new Error(`Shiprocket returned non-JSON response: ${text.substring(0, 100)}`);
        }

    } catch (error) {
        console.error("Shiprocket Internal Order Creation Error:", error);
        throw error;
    }
};

/**
 * @desc    Manual Login to Shiprocket (Optional endpoint)
 * @route   POST /api/shiprocket/login
 * @access  Private (Admin)
 */
export const loginShiprocket = async (req, res) => {
    try {
        const token = await authenticate();
        if (token) {
            res.status(200).json({
                success: true,
                message: "Shiprocket login successful",
                token: token
            });
        } else {
            res.status(401).json({
                success: false,
                message: "Shiprocket login failed. Check credentials in .env"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error logging in to Shiprocket",
            error: error.message
        });
    }
};

/**
 * @desc    Create an order in Shiprocket
 * @route   POST /api/shiprocket/create-order
 * @access  Private (Admin)
 */
export const createShiprocketOrder = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Shiprocket authentication failed. Please check credentials."
            });
        }

        console.log(`Using Shiprocket token for order creation (length: ${token.length})`);

        const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            body: JSON.stringify(req.body)
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();

            // Check if Shiprocket returned the "no activities found" message
            const trackingData = data[shipmentId] || data; // Shiprocket sometimes wraps response in the shipmentId key

            if (trackingData && trackingData.error && trackingData.error.includes("no activities found")) {
                return res.status(200).json({
                    success: true,
                    status: "Awaiting Pickup",
                    message: "Order has been created and AWB is assigned, but the courier has not picked up the package yet. Tracking will start once the package is scanned.",
                    data: trackingData
                });
            }

            res.status(response.status).json({
                success: response.ok,
                data
            });
        } else {
            const text = await response.text();
            console.error("Shiprocket Create Order Error (Non-JSON):", text);
            res.status(response.status).json({
                success: false,
                message: "Shiprocket returned non-JSON response",
                error: text.substring(0, 200)
            });
        }
    } catch (error) {
        console.error("Shiprocket Create Order Error:", error);
        res.status(500).json({
            success: false,
            message: "Error creating Shiprocket order",
            error: error.message
        });
    }
};

/**
 * @desc    Track an order in Shiprocket
 * @route   GET /api/shiprocket/track/:shipmentId
 * @access  Private (User/Admin)
 */
export const trackShipment = async (req, res) => {
    try {
        const { shipmentId } = req.params;
        const token = await getShiprocketToken();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Shiprocket authentication failed"
            });
        }

        console.log(`Using Shiprocket token for tracking (length: ${token.length})`);

        const response = await fetch(`${SHIPROCKET_API_URL}/courier/track/shipment/${shipmentId}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            res.status(response.status).json({
                success: response.ok,
                data
            });
        } else {
            const text = await response.text();
            console.error("Shiprocket Track Error (Non-JSON):", text);
            res.status(response.status).json({
                success: false,
                message: "Shiprocket returned non-JSON response",
                error: text.substring(0, 200)
            });
        }
    } catch (error) {
        console.error("Shiprocket Track Error:", error);
        res.status(500).json({
            success: false,
            message: "Error tracking shipment",
            error: error.message
        });
    }
};

/**
 * @desc    Get all shipments (Admin)
 * @route   GET /api/shiprocket/shipments
 */
export const getAllShipments = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        if (!token) return res.status(401).json({ success: false, message: "Unauthorized (Shiprocket login failed)" });

        console.log(`Using Shiprocket token (length: ${token.length}, prefix: ${token.substring(0, 10)}...)`);

        // In Shiprocket v2, listing shipments is primarily done via the orders endpoint
        const response = await fetch(`${SHIPROCKET_API_URL}/orders`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            res.status(response.status).json({
                success: response.ok,
                data
            });
        } else {
            const text = await response.text();
            console.error("Shiprocket Get Orders Error (Non-JSON):", text);
            res.status(response.status).json({
                success: false,
                message: "Shiprocket returned non-JSON response (Possible 403 Forbidden or Invalid Endpoint)",
                error: text.substring(0, 500)
            });
        }
    } catch (error) {
        console.error("Shiprocket Get Shipments Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching shipments",
            error: error.message
        });
    }
};
