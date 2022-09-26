import cronTimes from "../../stuplus-lib/constants/cronTimes";
import CronService from "./cronService";
import IBaseCronJob from "./jobs/IBaseCronJob";
import RedisDatabaseJob from "./jobs/RedisDatabaseJob";
const jobs: Array<IBaseCronJob> = [];

// const app = express();
setup()

function setup() {
    jobs.push(new RedisDatabaseJob({ customLockKey: "1", cronExpression: cronTimes.everyFifteenSeconds, title: "RedisDatabaseJob", description: "Job for database operations recorded in redis." }));
    CronService.init(jobs);
}


