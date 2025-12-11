 
import Order from "../models/OrderModel.js";
import { sendOrderUpdateEmail } from "../utils/sendEmail.js";
import Product from "../models/ProductModel.js";
import { sendSms } from "../utils/message.js";

// 1)place an order [Website]
export const placeOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { cartItems, paymentMethod, address } = req.body;

        
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }  

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

        const order = new Order({
            user: userId,
            cartItems: cartItems,
            totalPrice: totalPrice,
            paymentMethod: paymentMethod,
            address: address,
            deliveryDetails: {
                deliveryAddress: address,
                deliveryStatus: "Pending",
                deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
            }
        });

        await order.save();

        // Send email notification (optional check if email exists in req.user, otherwise fetch user)
        if (req.user.Email) {
            await sendOrderUpdateEmail(req.user.Email, "Order Placed Successfully", `Your order with ID ${order._id} has been placed.`);
            // await sendSms("+919666440579", "Order Placed Successfully", `Your order with ID ${order._id} has been placed.`);
        }

        res.status(200).json({
            success: true,
            message: "Order placed successfully",
            order: order
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
        const orders = await Order.find({ user: userId });
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

