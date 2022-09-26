import CronService from "./cronService";
import IBaseCronJob from "./jobs/IBaseCronJob";
import UpdateScoresJob from "./jobs/UpdateScoresJob";
import cronTimes from "../stuplus-lib/constants/cronTimes";
import UserLimitsJob from "./jobs/UserLimitsJob";
import express from "express"
import dotenv from "dotenv";
import logger, { setLogger } from "../stuplus-lib/config/logger";
import { config } from "./config/config";
import { initializeRedis } from "../stuplus-lib/services/redisService";
import { initializeDatabese } from "./config/database";

dotenv.config({ path: ".env" });
const jobs: Array<IBaseCronJob> = [];

const app = express();

setup();

async function setup() {
    setLogger("Stuplus Cron");
    await initializeDatabese();
    await initializeRedis();
    jobs.push(new UpdateScoresJob({ customLockKey: "1", cronExpression: cronTimes.everyThirtySeconds, title: "UpdateAnnouncementScoresJob", description: "Job for update active announcement scores(based on only likes right now)." }));
    jobs.push(new UserLimitsJob({ customLockKey: "2", cronExpression: cronTimes.everyDayAtMidnight, title: "UserLimitsJob", description: "Job for user limits." }));
    app.listen((config.PORT), () => {
        logger.info("Cron Server started at http://localhost:" + (config.PORT));
        console.log("Cron Server started at http://localhost:" + (config.PORT));
    });

    CronService.init(jobs);
}
