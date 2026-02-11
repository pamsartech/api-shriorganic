import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter product name"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Please enter product description"],
    },
    product_description: {
        type: String,
        required: true
    },
    product_details: {
        type: String,
        required: true
    },
    ratings: {
        type: Number,
        default: 0,
    },
    images: [
        {
            image: {
                type: String,
                required: true,
            },
        },
    ],
    category: {
        type: String,
        required: [true, "Please enter product category"],
    },
    // stock: {
    //     type: Number,
    //     required: [true, "Please enter product stock"],
    //     maxLength: [4, "Stock cannot exceed 4 characters"],
    //     default: 1,
    // },

    sizes: [
        {
            size: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            stock: {
                type: Boolean,
                default: true
            },
            weight:{
                type:String,
                required:true
            }
        }
    ],

    numOfReviews: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: String,
                ref: "User",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            rating: {
                type: Number,
                required: true,
            },
            comment: {
                type: String,
                required: true,
            },
            reviewId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Review",
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    is_deleted: {
        type: Boolean,
        default: false,
    },
    is_certified: {
        type: Boolean,
        default: false,
    },
    certified_image: {
        type: String,
        default: "",
    }
});

export default mongoose.model("Product", productSchema);

// shirt
// [x,l,m] -> size
// [red,clo] -> var