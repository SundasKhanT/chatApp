import mongoose, { Schema, Document } from "mongoose";

export interface User extends mongoose.Document {
  name: string;
  email: string;
}

const schema: Schema<User> = new Schema({
    name:{
    type: String,
    required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    }
},
{timestamps: true}
);

export const User = mongoose.model<User>("USer", schema)
