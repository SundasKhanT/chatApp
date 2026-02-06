import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitMQ.js";
import tryCatch from "../config/tryCatch.js";
import type { AuthnenticatedRequest } from "../middleware/isAuth.js";
import { User } from "../model/User.js";
import { redisClient } from "../server.js";
export const loginUser = tryCatch(async (req, res) => {
  const { email } = req.body;

  const rateLimitKey = `OTP:rateLimit:${email}`;
  const rateLimit = await redisClient.get(rateLimitKey);

  if (rateLimit) {
    res.status(429).json({
      message: "To many requests. Please wait before requesting new OTP",
    });
    return;
  }

  const OTP = Math.floor(100000 + Math.random() * 900000).toString();

  const OTPKey = `OTP:${email}`;
  await redisClient.set(OTPKey, OTP, {
    EX: 300,
  });

  await redisClient.set(rateLimitKey, "true", {
    EX: 60,
  });

  const message = {
    to: email,
    subject: "Your OTP Code",
    body: `Your OTP is ${OTP}. It is valid for 5 minutes.`,
  };

  await publishToQueue("send-OTP", JSON.stringify(message));
  res.status(200).json({
    message: "Your OTP sent to your mail",
  });
});

export const verifyUSer = tryCatch(async (req, res) => {
  const { email, OTP: enteredOTP } = req.body;

  if (!email || !enteredOTP) {
    res.status(400).json({
      message: "Email and OTP Required",
    });
    return;
  }

  const OTPKey = `OTP:${email}`;
  const storedOTP = await redisClient.get(OTPKey);

  if (!storedOTP || storedOTP !== enteredOTP) {
    res.status(400).json({
      message: "Invalid or expired OTP",
    });

    return;
  }

  await redisClient.del(OTPKey);

  let user = await User.findOne({ email });

  if (!user) {
    const name = email.slice(0, 8);
    user = await User.create({ name, email });
  }

  const token = generateToken(user);
  res.json({
    message: "user verified",
    user,
    token,
  });
});

export const myProfile = tryCatch(async (req: AuthnenticatedRequest, res) => {
  const user = req.user;
  res.json(user);
});

export const updateName = tryCatch(async (req: AuthnenticatedRequest, res) => {
  const user = await User.findById(req.user!._id);

  if (!user) {
    return res.status(404).json({
      message: "Please Login",
    });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Name is required",
    });
  }

  user.name = name;

  await user.save();

  const token = generateToken(user);

  res.json({
    message: "User updated successfully",
    user,
    token,
  });
});

export const getAllUsers = tryCatch(async (req: AuthnenticatedRequest, res) => {
  const users = await User.find();
  res.json(users);
});

export const getAUser = tryCatch(async (req: AuthnenticatedRequest, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});
