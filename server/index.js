import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import userRoutes from "./routes/AdminuserRoutes.js"
import userAuthRouters from "./routes/userAuthRouters.js"
import productRoutes from "./routes/productRoute.js";
import cartRoute from "./routes/cartRoute.js"
import { connectDB } from "./config/db.js";
import reviewRoute from "./routes/reviewRoute.js";
import orderRoute from "./routes/OrderRoute.js";
import notifyRoute from "./routes/notifyRoute.js";
import cookieParser from "cookie-parser"
import walletRoute from "./routes/WalletRoute.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import blogRoute from "./routes/BlogRoute.js";
import adminProductRoutes from "./routes/adminProductRoutes.js";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 4001;


// later has to change it to the domain name
const allowedOrigins = [
  "http://localhost:5173",
  "https://shri-organic.netlify.app/"

];

const corsOptions = {
  origin: true, // Allow all origins to fix the "CORS not allowed" error
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

app.use(cors(corsOptions))

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// basic rotue for testing the server
app.get("/", (req, res) => {

  res.status(200).json({
    sucess: true,
    message: "Hello from the server , server is working "
  })
});



// connecting the database
connectDB();


//  Server route  
app.use("/api/auth", userAuthRouters);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoute);
app.use("/api/review", reviewRoute);
app.use("/api/order", orderRoute);
app.use("/api/notify", notifyRoute)
app.use("/api/wallet", walletRoute)
app.use("/api/blog", blogRoute);



app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/user", userRoutes);
app.use("/api/admin/product", adminProductRoutes);



// server listner
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});



