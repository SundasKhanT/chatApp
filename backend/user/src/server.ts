import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import { createClient } from "redis";
import userRoutes from "./routes/user.js";
import { connectRabbitMQ } from "./config/rabbitMQ.js";

dotenv.config();
connectDb();
connectRabbitMQ();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("REDIS_URL is required");
export const redisClient = createClient({ url: redisUrl });

redisClient
  .connect()
  .then(() => console.log("connected to Redis"))
  .catch((err) => {
    console.warn(
      "Redis connection failed (app will run without Redis):",
      err.message,
    );
  });

const app = express();
app.use("api/v1", userRoutes);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
