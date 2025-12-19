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
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
})

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

// Generate a unique 6-digit sequential number for the order ID
OrderSchema.pre('save', async function (next) {
    if (this.isNew && !this._id) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'orderId' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this._id = 100000 + counter.seq;
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

const OrderModel = mongoose.model("Order", OrderSchema);
export default OrderModel;

