import mongoose from "mongoose";


const walletSchema = new mongoose.Schema({
    user: {
        type: String,
        ref: "User",
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions: [
        {
            type: {
                type: String,
                enum: ["deposit", "withdrawal", "order_payment", "refund"],
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            description: {
                type: String
            },
            referenceId: {
                type: String
            },
            status: {
                type: String,
                enum: ["pending", "completed", "failed"],
                default: "completed"
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });


export const Wallet = mongoose.model("Wallet", walletSchema);