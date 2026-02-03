import express from "express";
import dotenv from "dotenv";
import { startSendOTPConsumer } from "./consumer.js";

dotenv.config();
startSendOTPConsumer();
const app = express();
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
