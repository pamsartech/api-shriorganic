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
            comment: message,
            reviewId: review._id
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
        const { message, rating } = req.body;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found !!"
            })
        }

        // Check ownership
        if (review.user.toString() !== userId.toString()) {
            return res.status(401).json({
                success: false,
                message: "You are not authorized to edit this review"
            });
        }

        if (message) review.message = message;
        if (rating) review.rating = rating;
        await review.save();

        const product = await Product.findById(review.product);
        if (product) {
            const reviewIndex = product.reviews.findIndex((r) => r.user.toString() === userId.toString());
            if (reviewIndex !== -1) {
                if (message) product.reviews[reviewIndex].comment = message;
                if (rating) product.reviews[reviewIndex].rating = rating;
                await product.save();
            }
        }

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
        const { _id } = req.params;
        console.log("Params received:", req.params);

        // 1. Try to find the Review document directly
        let review = await Review.findById(_id);
        let product;

        if (review) {
            console.log("Review found by ID:", review._id);
            // Review found directly. Find associated product to remove embedded entry.
            product = await Product.findById(review.product);
            if (product) {
                product.reviews = product.reviews.filter(
                    (r) => r.user.toString() !== review.user.toString()
                );
                await product.save();
            }
            await Review.findByIdAndDelete(_id);
        } else {
            console.log("Review NOT found by ID. Checking Product subdocuments...");
            // 2. If not found, _id might be the subdocument ID in Product.reviews
            product = await Product.findOne({ "reviews._id": _id });

            if (product) {
                // Find the specific subdocument
                const reviewSubDoc = product.reviews.find(r => r._id.toString() === _id);

                if (reviewSubDoc) {
                    console.log("Found as subdocument in Product:", product._id);
                    // Remove the review document associated with this subdoc
                    // Try to use reviewId if it exists (new schema), otherwise match by user+product (legacy)
                    if (reviewSubDoc.reviewId) {
                        await Review.findByIdAndDelete(reviewSubDoc.reviewId);
                    } else {
                        // Fallback for old data: delete by user and product match
                        await Review.findOneAndDelete({
                            user: reviewSubDoc.user,
                            product: product._id
                        });
                    }

                    // Remove subdocument from product
                    product.reviews = product.reviews.filter(r => r._id.toString() !== _id);
                    await product.save();
                } else {
                    return res.status(404).json({
                        success: false,
                        message: "Review not found in product reviews"
                    });
                }
            } else {
                return res.status(404).json({
                    success: false,
                    message: "Review not found !!"
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Review deleted successfully !!"
        })
    } catch (error) {
        console.log(error);
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

