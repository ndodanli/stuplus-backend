import CronService from "./cronService";
import IBaseCronJob from "./jobs/IBaseCronJob";
import RedisDatabaseJob from "./jobs/RedisDatabaseJob";
import UpdateScoresJob from "./jobs/UpdateScoresJob";
import cronTimes from "../stuplus-lib/constants/cronTimes";
import UserLimitsJob from "./jobs/UserLimitsJob";

const jobs: Array<IBaseCronJob> = [];

// const app = express();
setup()

function setup() {
    import("./config/logger");
    jobs.push(new RedisDatabaseJob({ customLockKey: "1", cronExpression: cronTimes.everyFifteenSeconds, title: "RedisDatabaseJob", description: "Job for database operations recorded in redis." }));
    jobs.push(new UpdateScoresJob({ customLockKey: "2", cronExpression: cronTimes.everyThirtySeconds, title: "UpdateAnnouncementScoresJob", description: "Job for update active announcement scores(based on only likes right now)." }));
    jobs.push(new UserLimitsJob({ customLockKey: "3", cronExpression: cronTimes.everyDayAtMidnight, title: "UserLimitsJob", description: "Job for user limits." }));

    CronService.init(jobs);
}

// app.listen(config.PORT, () => {
    //     console.log(`Server started at http://localhost:${config.PORT}`);
    // logger.info(`Cron Server started at http://localhost:${config.PORT}`);
// });


