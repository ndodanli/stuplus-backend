import mongoose from "mongoose";
const userScheme = new mongoose.Schema({
  Email: { type: String, required: true },
  Password: { type: String, required: true },
  Role: { type: Number, required: true },
  FirstName: { type: String, required: false },
  LastName: { type: String, required: false },
});

export default mongoose.model("User", userScheme);
