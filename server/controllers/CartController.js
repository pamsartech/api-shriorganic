// to add the product in the cart
import { User } from "../models/userModel.js";
import Product from "../models/ProductModel.js";
import Cart from "../models/cartModel.js";
import redisClient from "../config/redisClient.js";

const calculateTotalPrice = (cartItems) => {
    return cartItems.reduce((acc, item) => {
        if (!item.product) return acc; // Skip items where product is null (deleted)

        let price = 0;
        if (item.product.sizes && item.product.sizes.length > 0) {
            const sizeInfo = item.product.sizes.find(s => s.size === item.size);
            if (sizeInfo) {
                price = sizeInfo.price;
            } else {
                // Fallback to first size price if specific size not found
                price = item.product.sizes[0] ? item.product.sizes[0].price : 0;
            }
        } else {
            // Fallback for legacy/unsized products
            price = item.product.price || 0;
        }
        return acc + price * item.quantity;
    }, 0);
}

export const addproducttocart = async (req, res) => {

    try {

        const { productId } = req.params;
        const { size } = req.body;

        console.log(req.user._id);
        console.log(size);


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

        // Validate size if product has sizes
        if (product.sizes && product.sizes.length > 0) {
            if (!size) {
                return res.status(400).json({
                    sucess: false,
                    message: "Please select a size"
                })
            }
            const sizeExists = product.sizes.find(s => s.size === size && s.stock === true);

            console.log(sizeExists);
            if (!sizeExists) {
                return res.status(400).json({
                    sucess: false,
                    message: "Selected size is not available"
                })
            }
        }

        const cart = await Cart.findOne({ user: user._id });
        if (!cart) {
            const newCart = new Cart({
                user: user._id,
                cartItems: [{
                    product: product._id,
                    quantity: 1,
                    size: size
                }]
            })
            await newCart.save();
        }
        else {
            // Check if product with same ID AND same size exists
            const cartItem = cart.cartItems.find(item =>
                item.product.toString() === productId && item.size === size
            );

            if (cartItem) {
                cartItem.quantity += 1;
            }
            else {
                cart.cartItems.push({
                    product: product._id,
                    quantity: 1,
                    size: size
                })
            }
            await cart.save();
        }



        const finalCart = await Cart.findOne({ user: user._id }).populate("cartItems.product");

        finalCart.totalAmount = calculateTotalPrice(finalCart.cartItems);
        await finalCart.save();

        // Fetch recommendations
        const cartProductIds = finalCart.cartItems.map(item => item.product?._id).filter(Boolean);
        const recommendations = await Product.find({
            _id: { $nin: cartProductIds },
            isActive: true,
            is_deleted: false
        }).limit(4).sort({ ratings: -1 });

        await redisClient.del(cacheKey);

        res.status(200).json({
            sucess: true,
            message: `${product.name} added to cart`,
            cart: finalCart,
            recommendations
        })

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
        cart.totalAmount = calculateTotalPrice(cart.cartItems);
        await cart.save();

        await redisClient.setEx(
            cacheKey,
            3600,
            JSON.stringify(cart)
        );

        // Fetch recommendations
        const cartProductIds = cart.cartItems.map(item => item.product?._id).filter(Boolean);
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
        const { size } = req.body;

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

        cart.cartItems = cart.cartItems.filter(item =>
            !(item.product._id.toString() === productId && (!size || item.size === size))
        );

        cart.totalAmount = calculateTotalPrice(cart.cartItems);
        await cart.save();


        // Fetch recommendations
        const cartProductIds = cart.cartItems.map(item => item.product?._id).filter(Boolean);
        const recommendations = await Product.find({
            _id: { $nin: cartProductIds },
            isActive: true,
            is_deleted: false
        }).limit(4).sort({ ratings: -1 });

        await redisClient.del(cacheKey);

        res.status(200).json({
            sucess: true,
            message: `${prodcut.name} remove the product !`,
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



// add the quantity of the product
export const addquantity = async (req, res) => {
    try {
        const cacheKey = `cart:${req.user._id}`;
        const { productId } = req.params;
        const { size } = req.body; // Extract size from body

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

        // Find item by Product ID AND Size (if applicable)
        const cartItem = cart.cartItems.find(item =>
            item.product._id.toString() === productId &&
            (!size || item.size === size)
        );

        if (!cartItem) {
            return res.status(404).json({
                sucess: false,
                message: "Item not found in cart"
            })
        }

        const product = cartItem.product;

        // Check if product is active
        if (product.isActive === false) {
            return res.status(400).json({
                sucess: false,
                message: "Product is currently unavailable"
            })
        }

        // Check stock availability
        if (product.sizes && product.sizes.length > 0) {
            const sizeInfo = product.sizes.find(s => s.size === cartItem.size);
            if (!sizeInfo) {
                return res.status(400).json({
                    sucess: false,
                    message: `Size ${cartItem.size} is no longer available`
                })
            }
            if (sizeInfo.stock === false) {
                return res.status(400).json({
                    sucess: false,
                    message: `Size ${cartItem.size} is out of stock`
                })
            }
        }

        cartItem.quantity += 1;

        cart.totalAmount = calculateTotalPrice(cart.cartItems);
        await cart.save();

        // Fetch recommendations
        const cartProductIds = cart.cartItems.map(item => item.product?._id).filter(Boolean);
        const recommendations = await Product.find({
            _id: { $nin: cartProductIds },
            isActive: true,
            is_deleted: false
        }).limit(4).sort({ ratings: -1 });

        await redisClient.del(cacheKey);

        res.status(200).json({
            sucess: true,
            message: "Product quantity added successfully",
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


// remove the quantity of the product
export const removequantity = async (req, res) => {
    try {
        const cacheKey = `cart:${req.user._id}`;
        const { productId } = req.params;
        const { size } = req.body; // Extract size

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

        const cartItemIdx = cart.cartItems.findIndex(item =>
            item.product._id.toString() === productId &&
            (!size || item.size === size)
        );

        if (cartItemIdx === -1) {
            return res.status(404).json({
                sucess: false,
                message: "Item not found in cart"
            })
        }

        if (cart.cartItems[cartItemIdx].quantity > 1) {
            cart.cartItems[cartItemIdx].quantity -= 1;
        } else {
            cart.cartItems.splice(cartItemIdx, 1);
        }

        cart.totalAmount = calculateTotalPrice(cart.cartItems);
        await cart.save();

        // Fetch recommendations
        const cartProductIds = cart.cartItems.map(item => item.product?._id).filter(Boolean);
        const recommendations = await Product.find({
            _id: { $nin: cartProductIds },
            isActive: true,
            is_deleted: false
        }).limit(4).sort({ ratings: -1 });

        await redisClient.del(cacheKey);

        res.status(200).json({
            sucess: true,
            message: "Product Quantity removed sucessfully",
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


// update the size/variation of a cart item (e.g. 100ml → 200ml, S → M)
// Only send newSize — current size is auto-read from the cart
export const updateCartItemSize = async (req, res) => {
    try {
        const cacheKey = `cart:${req.user._id}`;
        const { productId } = req.params;
        const { newSize } = req.body;

        if (!newSize) {
            return res.status(400).json({
                sucess: false,
                message: "Please provide newSize"
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                sucess: false,
                message: "User not found"
            });
        }

        const cart = await Cart.findOne({ user: user._id }).populate("cartItems.product");
        if (!cart) {
            return res.status(404).json({
                sucess: false,
                message: "Cart not found"
            });
        }

        // Find the cart item by productId — current size is read from it
        const cartItemIdx = cart.cartItems.findIndex(item =>
            item.product._id.toString() === productId
        );

        if (cartItemIdx === -1) {
            return res.status(404).json({
                sucess: false,
                message: "Product not found in cart"
            });
        }

        const cartItem = cart.cartItems[cartItemIdx];
        const currentSize = cartItem.size; // auto-read from cart

        if (currentSize === newSize) {
            return res.status(400).json({
                sucess: false,
                message: "New size is the same as the current size"
            });
        }

        const product = cartItem.product;

        // Validate the new size exists and is in stock
        if (product.sizes && product.sizes.length > 0) {
            const newSizeInfo = product.sizes.find(s => s.size === newSize);
            if (!newSizeInfo) {
                return res.status(400).json({
                    sucess: false,
                    message: `Size "${newSize}" does not exist for this product`
                });
            }
            if (newSizeInfo.stock === false) {
                return res.status(400).json({
                    sucess: false,
                    message: `Size "${newSize}" is out of stock`
                });
            }
        }

        const currentQuantity = cartItem.quantity;

        // Check if the new size already exists in the cart for the same product
        const existingNewSizeIdx = cart.cartItems.findIndex(item =>
            item.product._id.toString() === productId && item.size === newSize
        );

        if (existingNewSizeIdx !== -1) {
            // Merge quantities into the existing new-size item
            cart.cartItems[existingNewSizeIdx].quantity += currentQuantity;
            cart.cartItems.splice(cartItemIdx, 1);
        } else {
            // Just update the size in place
            cart.cartItems[cartItemIdx].size = newSize;
        }

        cart.totalAmount = calculateTotalPrice(cart.cartItems);
        await cart.save();

        // Fetch recommendations
        const cartProductIds = cart.cartItems.map(item => item.product?._id).filter(Boolean);
        const recommendations = await Product.find({
            _id: { $nin: cartProductIds },
            isActive: true,
            is_deleted: false
        }).limit(4).sort({ ratings: -1 });

        await redisClient.del(cacheKey);

        res.status(200).json({
            sucess: true,
            message: `Size updated from "${currentSize}" to "${newSize}" successfully`,
            cart,
            recommendations
        });
    } catch (error) {
        res.status(400).json({
            sucess: false,
            message: error.message
        });
    }
};
