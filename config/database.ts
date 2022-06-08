import mongoose from "mongoose"
import { config } from "./config"
export const initializeDatabese = async () => {
  return mongoose
    .connect(process.env.MONGODB_URL || config.MONGODB.MONGODB_URL)
    .then(() => {
      console.log("Successfully connected to database");
      return true;
    })
    .catch((error) => {
      console.log("database connection failed. exiting now...");
      console.error(error);
      process.exit(1);
    });
};