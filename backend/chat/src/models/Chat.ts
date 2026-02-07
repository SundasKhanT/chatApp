import mongoose, { Document, Schema } from "mongoose";

export interface Chat extends Document {
  users: String[];
  latestMessage: {
    text: string;
    sender: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const schema: Schema<Chat> = new Schema(
  {
    users: [{ type: String, required: true }],
    latestMessage: {
      text: String,
      sender: String,
    },
  },
  {
    timestamps: true,
  },
);

export const chat = mongoose.model<Chat>("Chat", schema);
