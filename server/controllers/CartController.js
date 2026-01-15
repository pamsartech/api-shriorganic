// to add the product in the cart
import { User } from "../models/userModel.js";
import Product from "../models/ProductModel.js";
import Cart from "../models/cartModel.js";


export const addproducttocart = async (req, res) => {

    try {

        const { productId } = req.params;
        const user = await User.findById(req.user._id);

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
                cartItem.quantity = 1;
            }
            else {
                cart.cartItems.push({
                    product: product._id,
                    quantity: 1
                })
            }
            await cart.save();
        }


        res.status(200).json({
            sucess: true,
            message: `${product.name} added to cart`
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

        // calulate the price of all the items
        cart.totalAmount = cart.cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
        await cart.save();

        res.status(200).json({
            sucess: true,
            cart
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
        const prodcut=await Product.findById(productId);
        
        cart.cartItems = cart.cartItems.filter(item => item.product._id.toString() !== productId);

        cart.totalAmount = cart.cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
        await cart.save();

        res.status(200).json({
            sucess: true,
            message:`${prodcut.name} remove the product !`
        })
        
    } catch (error) {
        res.status(400).json({
            sucess: false,
            message: error.message
        })
    }
}