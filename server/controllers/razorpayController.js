import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import Order from "../models/OrderModel.js";

// @desc    Create a new Razorpay Order
// @route   POST /api/razorpay/order
// @access  Private (User)
export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency = "INR", receipt = `receipt_${Date.now()}` } = req.body;

        if (!amount) {
            return res.status(400).json({
                success: false,
                message: "Amount is required"
            });
        }

        const options = {
            amount: amount * 100, // conversion to paise
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({
            success: false,
            message: "Error creating Razorpay order",
            error: error.message
        });
    }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/razorpay/verify
// @access  Private (User)
export const verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            res.status(200).json({
                success: true,
                message: "Payment verified successfully"
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid signature, payment verification failed"
            });
        }
    } catch (error) {
        console.error("Razorpay Verification Error:", error);
        res.status(500).json({
            success: false,
            message: "Error verifying payment",
            error: error.message
        });
    }
};

// @desc    Get all payments (Admin)
// @route   GET /api/admin/payments
// @access  Private (Admin)
export const fetchAllPayments = async (req, res) => {
    try {
        const { count = 10, skip = 0 } = req.query;
        const payments = await razorpay.payments.all({
            count: parseInt(count),
            skip: parseInt(skip)
        });

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error("Fetch Payments Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching payments from Razorpay",
            error: error.message
        });
    }
};

// @desc    Get payment details by ID
// @route   GET /api/admin/payments/:paymentId
export const getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await razorpay.payments.fetch(paymentId);

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error("Fetch Payment Detail Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching payment details",
            error: error.message
        });
    }
};

// @desc    Refund a payment
// @route   POST /api/admin/payments/:paymentId/refund
export const refundPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { amount, notes } = req.body;

        const refundOptions = {
            payment_id: paymentId,
        };

        if (amount) refundOptions.amount = amount * 100; // in paise
        if (notes) refundOptions.notes = notes;

        const refund = await razorpay.payments.refund(paymentId, refundOptions);

        res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            data: refund
        });
    } catch (error) {
        console.error("Refund Error:", error);
        res.status(500).json({
            success: false,
            message: "Error processing refund",
            error: error.message
        });
    }
};
