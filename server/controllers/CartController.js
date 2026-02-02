// to add the product in the cart
import { User } from "../models/userModel.js";
import Product from "../models/ProductModel.js";
import Cart from "../models/cartModel.js";
import redisClient from "../config/redisClient.js";

export const addproducttocart = async (req, res) => {

    try {

        const { productId } = req.params;
        const user = await User.findById(req.user._id);

        const cacheKey = `cart:${req.user._id}`;

        if (!user) {
            return res.status(404).json({
                sucess: false,
                message: "Please login !!!"
            })
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                sucess: false,
                message: "Product not found"
            })
        }

        const cart = await Cart.findOne({ user: user._id });
        if (!cart) {
            const newCart = new Cart({
                user: user._id,
                cartItems: [{
                    product: product._id,
                    quantity: 1
                }]
            })
            await newCart.save();
        }
        else {
            const cartItem = cart.cartItems.find(item => item.product.toString() === productId);
            if (cartItem) {
                cartItem.quantity += 1;
            }
            else {
                cart.cartItems.push({
                    product: product._id,
                    quantity: 1
                })
            }
            await cart.save();
        }



        const finalCart = await Cart.findOne({ user: user._id }).populate("cartItems.product");

        // Fetch recommendations
        const cartProductIds = finalCart.cartItems.map(item => item.product._id);
        const recommendations = await Product.find({
            _id: { $nin: cartProductIds },
            isActive: true,
            is_deleted: false
        }).limit(4).sort({ ratings: -1 });

        res.status(200).json({
            sucess: true,
            message: `${product.name} added to cart`,
            cart: finalCart,
            recommendations
        })
        await redisClient.del(cacheKey);

    } catch (error) {
        res.status(400).json({
            sucess: false,
            message: error.message
        })
    }
}


// to get the cart with the details
export const getcart = async (req, res) => {

    try {

        const cacheKey = `cart:${req.user._id}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            const cart = JSON.parse(cachedData);

            // Fetch recommendations
            const cartProductIds = cart.cartItems.map(item => item.product?._id).filter(Boolean);
            const recommendations = await Product.find({
                _id: { $nin: cartProductIds },
                isActive: true,
                is_deleted: false
            }).limit(4).sort({ ratings: -1 });

            return res.status(200).json({
                sucess: true,
                cart,
                recommendations,
                source: "redis"
            })
        }


        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                sucess: false,
                message: "User not found"
            })
        }

        const cart = await Cart.findOne({ user: user._id }).populate("cartItems.product");
        if (!cart) {
            const recommendations = await Product.find({
                isActive: true,
                is_deleted: false
            }).limit(4).sort({ ratings: -1 });

            return res.status(200).json({
                sucess: true,
                cart: { cartItems: [], totalAmount: 0 },
                recommendations
            })
        }

        // calulate the price of all the items
        cart.totalAmount = cart.cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
        await cart.save();

        await redisClient.setEx(
            cacheKey,
            3600,
            JSON.stringify(cart)
        );

        // Fetch recommendations
        const cartProductIds = cart.cartItems.map(item => item.product._id);
        const recommendations = await Product.find({
            _id: { $nin: cartProductIds },
            isActive: true,
            is_deleted: false
        }).limit(4).sort({ ratings: -1 });

        res.status(200).json({
            sucess: true,
            cart,
            recommendations
        })

    } catch (error) {
        res.status(400).json({
            sucess: false,
            message: error.message
        })
    }
}



// remove product one by one in cart 
export const removeproduct = async (req, res) => {

    try {

        const cacheKey = `cart:${req.user._id}`;
        const { productId } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                sucess: false,
                message: "User not found"
            })
        }
        const cart = await Cart.findOne({ user: user._id }).populate("cartItems.product");
        if (!cart) {
            return res.status(200).json({
                sucess: true,
                cart: { cartItems: [], totalAmount: 0 }
            })
        }
        const prodcut = await Product.findById(productId);

        cart.cartItems = cart.cartItems.filter(item => item.product._id.toString() !== productId);

        cart.totalAmount = cart.cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
        await cart.save();


        // Fetch recommendations
        const cartProductIds = cart.cartItems.map(item => item.product._id);
        const recommendations = await Product.find({
            _id: { $nin: cartProductIds },
            isActive: true,
            is_deleted: false
        }).limit(4).sort({ ratings: -1 });

        res.status(200).json({
            sucess: true,
            message: `${prodcut.name} remove the product !`,
            cart,
            recommendations
        })
        await redisClient.del(cacheKey);

    } catch (error) {
        res.status(400).json({
            sucess: false,
            message: error.message
        })
    }
}



// add the quantity of the product
export const addquantity = async (req, res) => {
    try {
        const cacheKey = `cart:${req.user._id}`;
        const { productId } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                sucess: false,
                message: "User not found"
            })
        }
        const cart = await Cart.findOne({ user: user._id }).populate("cartItems.product");
        if (!cart) {
            return res.status(200).json({
                sucess: true,
                cart: { cartItems: [], totalAmount: 0 }
            })
        }

        const cartItem = cart.cartItems.find(item => item.product._id.toString() === productId);
        if (cartItem) {
            cartItem.quantity += 1;
        }

        cart.totalAmount = cart.cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
        await cart.save();

        // Fetch recommendations
        const cartProductIds = cart.cartItems.map(item => item.product._id);
        const recommendations = await Product.find({
            _id: { $nin: cartProductIds },
            isActive: true,
            is_deleted: false
        }).limit(4).sort({ ratings: -1 });

        res.status(200).json({
            sucess: true,
            message: "Product quantity added successfully",
            cart,
            recommendations
        })
        await redisClient.del(cacheKey);
    } catch (error) {
        res.status(400).json({
            sucess: false,
            message: error.message
        })
    }
}


// remove the quantity of the product
export const removequantity = async (req, res) => {
    try {
        const cacheKey = `cart:${req.user._id}`;
        const { productId } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                sucess: false,
                message: "User not found"
            })
        }
        const cart = await Cart.findOne({ user: user._id }).populate("cartItems.product");
        if (!cart) {
            return res.status(200).json({
                sucess: true,
                cart: { cartItems: [], totalAmount: 0 }
            })
        }

        const cartItemIdx = cart.cartItems.findIndex(item => item.product._id.toString() === productId);
        if (cartItemIdx > -1) {
            if (cart.cartItems[cartItemIdx].quantity > 1) {
                cart.cartItems[cartItemIdx].quantity -= 1;
            } else {
                cart.cartItems.splice(cartItemIdx, 1);
            }
        }

        cart.totalAmount = cart.cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
        await cart.save();

        // Fetch recommendations
        const cartProductIds = cart.cartItems.map(item => item.product._id);
        const recommendations = await Product.find({
            _id: { $nin: cartProductIds },
            isActive: true,
            is_deleted: false
        }).limit(4).sort({ ratings: -1 });

        res.status(200).json({
            sucess: true,
            message: "Product Quantity removed sucessfully",
            cart,
            recommendations
        })
        await redisClient.del(cacheKey);
    } catch (error) {
        res.status(400).json({
            sucess: false,
            message: error.message
        })
    }
}

