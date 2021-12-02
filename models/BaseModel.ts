import { model, Schema } from "mongoose";

const collection = "User";

const baseOptions = {
  collection,
  timestamps: true,
};

export const Base = model("Base", new Schema({
  Title: { type: String, required: false, default: null },
}, baseOptions));

export default interface BaseModel {
  createdAt: Date;
  updatedAt: Date;
  Title: String | null;
}