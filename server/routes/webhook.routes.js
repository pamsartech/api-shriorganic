import express from "express";
import crypto from "crypto";
import bodyParser from "body-parser";
import Order from "../models/OrderModel.js";
import { createShiprocketOrderInternal } from "../controllers/shipRocket.js";

const router = express.Router();

router.post(
    "/razorpay",
    bodyParser.raw({ type: "application/json" }),
    async (req, res) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(req.body)
            .digest("hex");

        if (signature === expectedSignature) {
            const event = JSON.parse(req.body.toString());
            console.log("Webhook Event:", event.event);

            if (event.event === "payment.captured") {
                const paymentEntity = event.payload.payment.entity;
                const razorpayOrderId = paymentEntity.order_id;

                // Find order and populate user and product details for Shiprocket
                const order = await Order.findOne({ razorpayOrderId: razorpayOrderId })
                    .populate("user")
                    .populate("cartItems.product");


                    console.log(order);

                if (order) {
                    order.paymentstatus = "Paid";
                    await order.save();
                    console.log(`Order ${order._id} marked as Paid via Webhook`);



                    // Automatically create Shiprocket Order
                    try {
                        const shiprocketResponse = await createShiprocketOrderInternal(order);
                        if (shiprocketResponse && shiprocketResponse.order_id) {
                            order.shiprocketOrderId = shiprocketResponse.order_id;
                            order.shiprocketShipmentId = shiprocketResponse.shipment_id;
                            order.orderStatus = "shipped"; // Optional: update status
                            await order.save();
                            console.log("Shiprocket Order Created Successfully:", shiprocketResponse.order_id);
                        }
                    } catch (shipErr) {
                        console.error("Failed to create Shiprocket order via Webhook:", shipErr.message);
                    }

                } else {
                    console.log(`Order not found for Razorpay Order ID: ${razorpayOrderId}`);
                }
            }

            res.status(200).json({ status: "ok" });
        } else {
            res.status(400).json({ status: "invalid" });
        }
    }
);

export default router;
