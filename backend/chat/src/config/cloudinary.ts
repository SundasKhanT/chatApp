import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  Cloud_Name: process.env.Cloud_Name,
  API_Key: process.env.API_Key,
  API_Secret: process.env.API_Sectet,
});

export default cloudinary;
