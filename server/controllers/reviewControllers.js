import Review from "../models/reviewModel.js";
import Product from "../models/ProductModel.js";
import { User } from "../models/userModel.js";


// add review to product

export const addreveiw = async (req, res) => {

    try {
        const { productId, message, rating } = req.body;

        const userId = req.user._id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found !!"
            })
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found !!"
            })
        }

        const review = await Review.create({
            user: userId,
            message: message,
            product: productId,
            rating: rating
        })

        product.reviews.push({
            user: userId,
            name: user.FirstName,
            rating: rating,
            comment: message
        });
        await product.save();

        res.status(200).json({
            success: true,
            review,
            message: "Review added successfully !!"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}

// edit review 
export const editreview = async (req, res) => {

    try {

        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found !!"
            })
        }

        review.message = req.body.message;
        review.rating = req.body.rating;
        await review.save();

        res.status(200).json({
            success: true,
            review,
            message: "Review edited successfully !!"
        })

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

// delete review for the product

export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found !!"
            })
        }
        await review.remove();
        res.status(200).json({
            success: true,
            message: "Review deleted successfully !!"
        })
    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}


// like the review 
export const likeReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found !!"
            })
        }

        const userId = req.user._id.toString();
        const isLiked = review.likes.some(id => id.toString() === userId);

        if (isLiked) {
            review.likes = review.likes.filter((id) => id.toString() !== userId);
            await review.save();
            return res.status(200).json({
                success: true,
                review,
                message: "Review unliked successfully !!"
            });
        }

        review.likes.push(userId);
        await review.save();
        res.status(200).json({
            success: true,
            review,
            message: "Review liked successfully !!"
        })
    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

// dislike the review 
export const dislikeReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found !!"
            })
        }

        const userId = req.user._id.toString();
        const isLiked = review.likes.some(id => id.toString() === userId);

        if (isLiked) {
            review.likes = review.likes.filter((id) => id.toString() !== userId);
            await review.save();
            return res.status(200).json({
                success: true,
                review,
                message: "Review disliked (like removed) successfully !!"
            });
        }

        return res.status(400).json({
            success: false,
            message: "You have not liked this review yet!"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

// show the reveiw
export const showReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found !!"
            })
        }
        res.status(200).json({
            success: true,
            review,
            message: "Review fetched successfully !!"
        })
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        })
    }

}

