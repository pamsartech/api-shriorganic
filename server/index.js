import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import userRoutes from "./routes/userRoutes.js"
import userAuthRouters from "./routes/userAuthRouters.js"
import productRoutes from "./routes/productRoute.js";
import cartRoute from "./routes/cartRoute.js"
import { connectDB } from "./config/db.js";
import reviewRoute from "./routes/reviewRoute.js";
import orderRoute from "./routes/OrderRoute.js";
import notifyRoute from "./routes/notifyRoute.js";
import cookieParser from "cookie-parser"
import walletRoute from "./routes/WalletRoute.js";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 4001;


// add the comment
const allowedOrigins = [
  "*",
  "http://localhost:5173"
];

const corsOptions = {
  origin: function (origin, callback) {

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
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
app.use("/api/user", userRoutes);
app.use("/api/auth", userAuthRouters);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoute);
app.use("/api/review", reviewRoute);
app.use("/api/order", orderRoute);
app.use("/api/notify", notifyRoute)
app.use("/api/wallet", walletRoute)



// server listner
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});



