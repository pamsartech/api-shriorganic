import mongoose from "mongoose";


const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please enter blog title"],
    },
    description: {
        type: String,
        required: [true, "Please enter blog description"],
    },
    image: {
        type: String,
        required: [true, "Please enter blog image"],
    },
    type: {
        type: String,
        required: [true, "Please enter blog type"],
    },
    category: {
        type: String,
        required: [true, "Please enter blog category"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    is_deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model("Blog", blogSchema);
