import path from "path";
import logger from "../../stuplus-lib/config/logger";
import RedisService from "../../stuplus-lib/services/redisService";
const mongoose = require("mongoose")
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const initializeRedis = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await RedisService.client.connect();
      console.log("redis client created");
      resolve(true);
    } catch (error) {
      logger.error({ err: error }, "An error occurred while connecting to redis.");
      console.error({ err: error }, "An error occurred while connecting to redis.");
      process.exit(1);
    }
  });
};

export {
  initializeRedis
}
