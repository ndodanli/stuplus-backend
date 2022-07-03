import CronService from "./cronService";
import IBaseCronJob from "./jobs/IBaseCronJob";
import RedisDatabaseJob from "./jobs/RedisDatabaseJob";
import express from "express";
import { config } from "./config/config";
import logger from "./config/logger";
import UpdateAnnouncementScoresJob from "./jobs/UpdateAnnouncementScoresJob";
import cronTimes from "../stuplus-lib/constants/cronTimes";

const jobs: Array<IBaseCronJob> = [];

// const app = express();
setup()

function setup() {
    import("./config/logger");
    jobs.push(new RedisDatabaseJob({ customLockKey: "1", cronExpression: cronTimes.everyTwentySeconds, title: "RedisDatabaseJob", description: "Job for database operations recorded in redis." }));
    jobs.push(new UpdateAnnouncementScoresJob({ customLockKey: "1", cronExpression: cronTimes.everyThirtySeconds, title: "UpdateAnnouncementScoresJob", description: "Job for update active announcement scores(based on only likes right now)." }));

    CronService.init(jobs);
}

// app.listen(config.PORT, () => {
    //     console.log(`Server started at http://localhost:${config.PORT}`);
    // logger.info(`Cron Server started at http://localhost:${config.PORT}`);
// });


