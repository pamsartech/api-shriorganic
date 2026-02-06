import Wishlist from "../models/WishlistModel.js";
import Product from "../models/ProductModel.js";

// Add to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                user: userId,
                products: [productId]
            });
        } else {
            if (wishlist.products.includes(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Product already in wishlist"
                });
            }
            wishlist.products.push(productId);
        }

        await wishlist.save();

        res.status(200).json({
            success: true,
            message: "Added to wishlist",
            wishlist
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to add to wishlist",
            error: error.message
        });
    }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params; // Using params for removal usually

        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found"
            });
        }

        wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
        await wishlist.save();

        res.status(200).json({
            success: true,
            message: "Removed from wishlist",
            wishlist
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to remove from wishlist",
            error: error.message
        });
    }
};

// Get wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const wishlist = await Wishlist.findOne({ user: userId }).populate("products");

        if (!wishlist) {
            return res.status(200).json({
                success: true,
                message: "Wishlist fetched successfully",
                wishlist: { products: [] }
            });
        }

        // Filter out any null products (in case of deletion)
        wishlist.products = wishlist.products.filter(p => p !== null);

        // Also map to add 'price' field if needed (like logic in products)
        // But for now, returning raw populated products is fine as schema has it.
        // Actually, user liked the 'price' field logic earlier.
        // Let's modify the response to include 'price' (from first size) for consistency.

        const productsWithPrice = wishlist.products.map(product => {
            const productObj = product.toObject();
            if (productObj.sizes && productObj.sizes.length > 0) {
                productObj.price = productObj.sizes[0].price;
            } else {
                productObj.price = 0;
            }
            return productObj;
        });


        res.status(200).json({
            success: true,
            message: "Wishlist fetched successfully",
            wishlist: { ...wishlist.toObject(), products: productsWithPrice }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch wishlist",
            error: error.message
        });
    }
};
