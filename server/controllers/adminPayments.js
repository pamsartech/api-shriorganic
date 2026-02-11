import orders from "razorpay/dist/types/orders";


// to get all the payments from order id
export const getAllPayments = async (req, res) => {
    try {
        const payments = await orders.find();
        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching payments",
            error: error
        });
    }
}