import mongoose from "mongoose";

const connectDb = async () => {
  const url = process.env.MONGO_URI;

  if (!url) {
    throw new Error("MongoDb URI is not defined");
  }

  try {
    await mongoose.connect(url, {
      dbName: "chat-app",
    });
    console.log("Successfully connected to MongoDB");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDb;