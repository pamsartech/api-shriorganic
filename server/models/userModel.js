import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    _id: {
        type: String, // overriding the default ObjectId to String
    },
    FirstName: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"]
    },
    LastName: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"]
    },
    Email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    Password: {
        type: String,
        default: ""
    },
    PhoneNumber: {
        type: String,
        required: [true, "Phone number is required"],
        unique: true,
        minlength: [9, "Phone number must be at least 9 digits"],
        maxlength: [15, "Phone number must not more than 15 digits"],
        match: [/^\d{9,15}$/, "Phone number must be between 9–15 digits"]
    },
    Dob: Date,
    address: {
        street: String,
        city: String,
        state: String,
        zipcode: {
            type: String,
            match: [/^\d{5,6}$/, "Zip code must be 5 or 6 digits"]
        },
        country: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    communicationMethod: {
        type: String,
        default: "email"
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    wallet: {
        type: Number,
        default: 0
    },
    otpHash: {
        type: String,
        default: null
    },
    otpExpire: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Custom ID generation: CC-0001 format
userSchema.pre('save', async function (next) {
    if (this.isNew && !this._id) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'userId' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this._id = counter.seq.toString().padStart(4, '0');
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});



export const User = mongoose.model("User", userSchema);
