// model for cart

import mongoose from "mongoose";


const cartSchema = new mongoose.Schema({

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
            quantity: {
                type: Number,
                default: 1
            }
        }
    ],
    totalAmount: {
        type: Number,
        default: 0
    }
});

export default mongoose.model("Cart", cartSchema)
