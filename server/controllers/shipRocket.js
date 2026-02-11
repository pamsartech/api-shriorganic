import redisClient from "../config/redisClient.js";

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

        const response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.token) {
            // Store token in Redis with an expiry (Shiprocket tokens usually last 24h)
            await redisClient.setEx("shiprocket_token", 86400, data.token);
            return data.token;
        } else {
            console.error("Shiprocket login failed:", data);
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
            pickup_location: "Primary",
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
            weight: totalWeight || 0.5
        };

        const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Shiprocket Order Creation Response:", data);
        return data;

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

        const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        res.status(response.status).json({
            success: response.ok,
            data
        });
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

        const response = await fetch(`${SHIPROCKET_API_URL}/courier/track/shipment/${shipmentId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        res.status(response.status).json({
            success: response.ok,
            data
        });
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

        const response = await fetch(`${SHIPROCKET_API_URL}/shipments`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        res.status(response.status).json({
            success: response.ok,
            data
        });
    } catch (error) {
        console.error("Shiprocket Get Shipments Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching shipments",
            error: error.message
        });
    }
};
