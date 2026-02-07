import axios from "axios";
import tryCatch from "../config/tryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { chat } from "../models/chat.js";
import { Messages } from "../models/Messages.js";

export const createNewChat = tryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { otherUSerId } = req.body;

    if (!otherUSerId) {
      res.status(400).json({
        message: "other userId is required",
      });
      return;
    }
    const existingChat = await chat.findOne({
      users: { $all: [userId, otherUSerId], $size: 2 },
    });

    if (existingChat) {
      res.json({
        message: "Chat already exist",
        chatId: existingChat._id,
      });
      return;
    }

    const newChat = await chat.create({
      users: [userId, otherUSerId],
    });
    res.status(201).json({
      message: "New Chat created",
      chatId: newChat._id,
    });
  },
);

export const getAllChats = tryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  if (!userId) {
    res.status(400).json({
      message: "userId missing",
    });
    return;
  }

  const chats = await chat.find({ users: userId }).sort({ updatedAt: -1 });
  const chatWithUserData = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.users.find((id) => id !== userId);

      const unSeenCount = await Messages.countDocuments({
        chatId: chat._id,
        sender: { $ne: userId },
        seen: false,
      });

      try {
        const { data } = await axios.get(
          `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
        );
        return {
          user: data,
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unSeenCount,
          },
        };
      } catch (error) {
        console.log(error);
        return {
          user: { _id: otherUserId, name: "Unknown User" },
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unSeenCount,
          },
        };
      }
    }),
  );
  res.json({
    chat: chatWithUserData,
  });
});
