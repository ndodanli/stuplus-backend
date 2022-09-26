import path from "path";
const mongoose = require("mongoose")
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const initializeDatabese = async () => {
  return mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
      console.log("Successfully connected to database");
      return true;
    })
    .catch((error: any) => {
      console.log("database connection failed. exiting now...");
      console.error(error);
      process.exit(1);
    });
};

export {
  initializeDatabese
}
