import mongoose, { Schema, type Types } from "mongoose";

export interface Message extends Document {
  chatId: Types.ObjectId;
  sender: String;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: Boolean;
  seenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<Message>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: String,
      requried: true,
    },
    text: String,
    image: {
      url: String,
      publicaId: String,
    },
    messageType: {
      type: String,
      enum: ["text", "image"],
      required: true,
      default: "text",
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const Messages = mongoose.model<Message>("Messages", schema);
