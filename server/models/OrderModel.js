import mongoose from "mongoose";

// Schema for the order

const OrderSchema = new mongoose.Schema({
    _id: Number,
    user: {
        type: String,
        ref: "User"
    },
    cartItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: Number,
        }
    ],
    totalPrice: Number,
    orderStatus: {
        type: String,
        default: "Processing"
    },
    paymentMethod: String,
    paymentstatus: {
        type: String,
        default: "Pending"
    },
    address: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    deliveryDetails: {
        deliveryStatus: {
            type: String,
            default: "Pending"
        },
        deliveryDate: Date,
        deliveryAddress: String
    }
})

// Generate a 6-digit random number for the order ID
OrderSchema.pre('save', async function (next) {
    if (this.isNew && !this._id) {
        this._id = Math.floor(100000 + Math.random() * 900000);
    }
    next();
});

const OrderModel = mongoose.model("Order", OrderSchema);
export default OrderModel;

