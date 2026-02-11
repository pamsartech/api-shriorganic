// import { createClient } from "redis";

// const redisClient = createClient({
//   url: "redis://localhost:6379"
// });

// redisClient.on("error", (err) => {
//   console.error("Redis Error:", err);
// });

// await redisClient.connect();
// console.log("Redis connected");

// export default redisClient;


// for cloud 
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.connect();
console.log("Redis connected");

export default redisClient;



