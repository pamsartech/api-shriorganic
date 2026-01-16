import { Wallet } from "../models/walletModel.js";
import redisClient from "../config/redisClient.js";

// to add money in wallet
export const addMoney = async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            const newWallet = new Wallet({
                user: userId,
                balance: amount,
                transactions: [
                    {
                        type: "deposit",
                        amount,
                        description: "Initial deposit",
                        referenceId: "DEPOSIT" + Date.now(),
                        status: "completed"
                    }
                ]
            });
            await newWallet.save();
            res.status(200).json({
                sucess: true,
                message: "Money added to wallet",
                wallet: newWallet
            });
        } else {
            wallet.balance += amount;
            wallet.transactions.push({
                type: "deposit",
                amount,
                description: "Deposit",
                referenceId: "DEPOSIT" + Date.now(),
                status: "completed"
            });
            await wallet.save();
            res.status(200).json({
                sucess: true,
                message: "Money added to wallet",
                wallet
            });
        }
    } catch (error) {
        res.status(400).json({
            sucess: false,
            message: "Failed to add money to wallet",
            error: error.message
        });
    }
}

// to get the wallet details
export const getWallet = async (req, res) => {
    try {
        const cacheKey = `wallet:${req.user._id}`;

        const cachedWallet = await redisClient.get(cacheKey);

        if (cachedWallet) {
            return res.status(200).json({
                sucess: true,
                message: "Wallet details",
                wallet: JSON.parse(cachedWallet)
            });
        }

        const userId = req.user._id;
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            return res.status(404).json({
                sucess: false,
                message: "Wallet not found"
            });
        }
        res.status(200).json({
            sucess: true,
            message: "Wallet details",
            wallet
        });

        await redisClient.setEx(
            cacheKey,
            3600,
            JSON.stringify(wallet)
        );
    } catch (error) {
        res.status(400).json({
            sucess: false,
            message: "Failed to get wallet details",
            error: error.message
        });
    }
}