
import mongoose from "mongoose";


const reviewSchema = new mongoose.Schema({
    user: {
        type: String,
        ref: "User"
    },
    message: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        max: 5,
        min: 1
    },
    product: {
        type: String,
        ref: "Product"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: [{
            type: String,
            ref: "User"
        }],
        validate: {
            validator: function (v) {
                return new Set(v).size === v.length;
            },
            message: 'Duplicate likes are not allowed'
        }
    }
})

export default mongoose.model("Review", reviewSchema)