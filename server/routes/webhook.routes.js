import express from "express";
import crypto from "crypto";
import bodyParser from "body-parser";
import Order from "../models/OrderModel.js";

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

            // 👉 update DB order status here

            if (event.event === "payment.captured") {
                const orderId = event.data.order_id;
                const order = await Order.findById(orderId);
                if (order) {
                    order.orderStatus = "Paid";
                    await order.save();
                }
            }

            res.status(200).json({ status: "ok" });
        } else {
            res.status(400).json({ status: "invalid" });
        }
    }
);

export default router;
