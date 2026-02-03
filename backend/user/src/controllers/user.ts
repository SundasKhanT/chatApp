import { publishToQueue } from "../config/rabbitMQ.js";
import tryCatch from "../config/tryCatch.js";
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
