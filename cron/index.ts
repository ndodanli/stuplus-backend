import cron from "node-cron"
import RedisDatabaseJobModel from "./models/RedisDatabaseJob";

const jobs = [];

jobs.push(new RedisDatabaseJobModel("*/30 * * * * *"))

