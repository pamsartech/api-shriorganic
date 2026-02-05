
import crypto from "crypto";
import Order from "../models/OrderModel.js";
import { sendOrderUpdateEmail } from "../utils/sendEmail.js";
import Product from "../models/ProductModel.js";
import { sendSms } from "../utils/message.js";

import { User } from "../models/userModel.js";
import Cart from "../models/cartModel.js";
import razorpay from "../config/razorpay.js";

// 1)place an order [Website]
export const placeOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { paymentMethod, address } = req.body;

        console.log(userId);
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        const cartItems = cart.cartItems;

        // check the stock availability
        for (let i = 0; i < cartItems.length; i++) {
            const product = await Product.findById(cartItems[i].product);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }
            if (product.stock < cartItems[i].quantity) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock for product " + product.name
                });
            }
        }

        //  calcluate the total price of the product of the data
        let totalPrice = 0;
        for (let i = 0; i < cartItems.length; i++) {
            const product = await Product.findById(cartItems[i].product);
            totalPrice += product.price * cartItems[i].quantity;
        }

        const orderAddress = address || user.address;

        if (!orderAddress) {
            return res.status(400).json({
                success: false,
                message: "Delivery address is required"
            });
        }


        // Generate Razorpay Order
        let razorpayOrder = null;
        try {
            razorpayOrder = await razorpay.orders.create({
                amount: totalPrice * 100, // INR to paise
                currency: "INR",
                receipt: "receipt_" + Date.now(),
            });
        } catch (err) {
            console.log("Razorpay Error:", err);
            return res.status(500).json({
                success: false,
                message: "Payment initialization failed",
                error: err.message
            });
        }

        const order = new Order({
            user: userId,
            cartItems: cartItems,
            totalPrice: totalPrice,
            paymentMethod: paymentMethod,
            address: orderAddress,
            deliveryDetails: {
                deliveryAddress: orderAddress,
                deliveryStatus: "Pending",
                deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
            }
        });

        await order.save();

        // Clear the cart
        cart.cartItems = [];
        cart.totalAmount = 0;
        await cart.save();

        // Send email notification 
        // if (user.Email) {
        //     await sendOrderUpdateEmail(user.Email, "Order Placed Successfully", `Your order with ID ${order._id} has been placed.`);
        // }

        res.status(200).json({
            success: true,
            message: "Order placed successfully",
            order: order,
            razorpayOrder: razorpayOrder
        });

    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Order placement failed",
            error: error.message
        });
    }
}


// 2)view all the orders of the  user  [Website]
export const viewOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order.find({ user: userId }).populate("cartItems.product");
        res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            orders: orders
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
}

// 3)to view the all the details of the specific order [Website]
export const viewOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);
        res.status(200).json({
            success: true,
            message: "Order details fetched successfully",
            order: order
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to fetch order details",
            error: error.message
        });
    }
}

// 4)to Cancel the order by the user[Website]
export const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        order.orderStatus = "Cancelled";
        await order.save();

        // Send email notification (optional check if email exists in req.user, otherwise fetch user)
        if (req.user.Email) {
            await sendOrderUpdateEmail(req.user.Email, "Order Cancelled", `Your order with ID ${order._id} has been cancelled.`);
        }
        res.status(200).json({
            success: true,
            message: "Order cancelled successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to cancel order",
            error: error.message
        });
    }
}


// to delete the order by the admin [Admin]
export const deleteOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findByIdAndDelete(orderId);
        res.status(200).json({
            success: true,
            message: "Order deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to delete order",
            error: error.message
        });
    }
}


// this all form the admin apis

// to get all the orders for admin [Admin]
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({ is_deleted: false });
        res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            orders: orders
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
}

// to soft delete the order by the admin [Admin]
export const softDeleteOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findByIdAndUpdate(orderId, { is_deleted: true });
        res.status(200).json({
            success: true,
            message: "Order soft deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to soft delete order",
            error: error.message
        });
    }
}


// to bulk soft delete the order by the admin [Admin]
export const bulkSoftDeleteOrder = async (req, res) => {
    try {
        const orderIds = req.body.orderIds;
        const orders = await Order.updateMany({ _id: { $in: orderIds } }, { is_deleted: true });
        res.status(200).json({
            success: true,
            message: "Orders soft deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to soft delete orders",
            error: error.message
        });
    }
}

// to hard delete the order by the admin [Admin]

export const hardDeleteOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findByIdAndDelete(orderId);
        res.status(200).json({
            success: true,
            message: "Order hard deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to hard delete order",
            error: error.message
        });
    }
}

// to get order by id [Admin]

export const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Check if orderId is numeric since Order model uses Number for _id
        if (isNaN(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Order ID"
            });
        }
        res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            order: order
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to fetch order",
            error: error.message
        });
    }
}

// update order by id [Admin]

export const updateOrderById = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findByIdAndUpdate(orderId, req.body, { new: true });
        res.status(200).json({
            success: true,
            message: "Order updated successfully",
            order: order
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to update order",
            error: error.message
        });
    }
}


// search order by id [Admin]

export const searchOrderById = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);
        res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            order: order
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Failed to fetch order",
            error: error.message
        });
    }
}

// to verify payment 
export const verifyPayment = async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    } = req.body;

    const body =
        razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false });
    }
}

