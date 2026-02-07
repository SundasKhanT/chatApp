import axios from "axios";
import tryCatch from "../config/tryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { chat } from "../models/Chat.js";
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

export const sendMessage = tryCatch(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user?._id;
  const { chatId, text } = req.body;
  const imageFile = req.file;

  if (!senderId) {
    res.status(401).json({
      message: "unAutorized",
    });
    return;
  }

  if (!chatId) {
    res.status(401).json({
      message: "ChatId required",
    });
    return;
  }

  if (!text && !imageFile) {
    res.status(400).json({
      message: "Either text or image is  required",
    });
    return;
  }
  const chatMessage = await chat.findById(chatId);
  if (!chatMessage) {
    res.status(404).json({
      message: "Chat not found",
    });
  }
  const isUserInChat = chatMessage?.users.some(
    (userId) => userId.toString() === senderId.toString(),
  );

  if (!isUserInChat) {
    res.status(403).json({
      message: " You are not the participant of this chat",
    });
    return;
  }
  const otherUserId = chatMessage?.users.find(
    (userId) => userId.toString() !== senderId.toString(),
  );
  if (!otherUserId) {
    res.status(401).json({
      message: "No other user Id",
    });
    return;
  }

  //socket setup

  let messageData: any = {
    chatId: chatId,
    sender: senderId,
    seen: false,
    seenAt: undefined,
  };

  if (imageFile) {
    messageData.image = {
      url: imageFile.path,
      publicId: imageFile.filename,
    };
    messageData.messageType = "image";
    messageData.text = text || "";
  } else {
    messageData.text = text;
    messageData.messageType = "text";
  }

  const message = new Messages(messageData);
  const savedMessage = await message.save();
  const latestMessageText = imageFile ? "Imaga" : text;

  await chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: {
        text: latestMessageText,
        sender: senderId,
      },
      updatedAt: new Date(),
    },
    { new: true },
  );

  //emit to sockets
  res.status(201).json({
    message: savedMessage,
    sender: senderId,
  });
});
export const getMessagesByChat = tryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
      res.status(401).json({
        message: "unauthorized",
      });
      return;
    }

    if (!chatId) {
      res.status(400).json({
        message: "ChatId Required",
      });
      return;
    }

    const chatMessage = await chat.findById(chatId);
    if (!chatMessage) {
      res.status(404).json({
        message: "chat not found",
      });
      return;
    }
    const isUserInChat = chatMessage?.users.some(
      (userId) => userId.toString() === userId.toString(),
    );

    if (!isUserInChat) {
      res.status(403).json({
        message: " You are not the participant of this chat",
      });
      return;
    }
    const messageToMarkSeen = await Messages.find({
      chatId: chatId,
      senderId: { $ne: userId },
      seen: false,
    });

    await Messages.updateMany(
      {
        chatId: chatId,
        senderId: { $ne: userId },
        seen: false,
      },
      { seen: true, seenAt: new Date() },
    );
    const messages = await Messages.find({ chatId }).sort({
      createdAt: 1,
    });

    const otherUserId = chatMessage.users.find((id) => id !== userId);
    try {
      const { data } = await axios.get(
        `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
      );

      if (!otherUserId) {
        res.status(400).json({
          message: "N0 other user",
        });
        return;
      }

      //socker works
      res.json({
        messages,
        user: data,
      });
    } catch (error) {
      console.log(error);
      res.json({
        messages,
        user: { _id: otherUserId, name: "Unkown User" },
      });
    }
  },
);
