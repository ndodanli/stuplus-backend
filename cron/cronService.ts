import cron from "node-cron"
import AsyncLock from "async-lock"
import IBaseCronJob from "./jobs/IBaseCronJob";
import logger from "./config/logger";
import { stringify } from "../stuplus-lib/utils/general";
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export default class CronService {
    private static lock = new AsyncLock({ timeout: 5000 });

    static init(jobs: Array<IBaseCronJob>): void {
        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];
            let jobLock: AsyncLock;
            if (job.customLock) {
                jobLock = job.customLock;
            } else {
                jobLock = CronService.lock;
            }
            const lockKey = job.constructor.name;
            cron.schedule(job.cronExpression, async () => {
                jobLock.acquire(lockKey, async function (done: any) {
                    try {
                        await job.run();
                    } catch (error: any) {
                        logger.error(`Job ${job.title} failed. {Error}`, stringify({ ErorMessage: error.message, ErrorStack: error.stack, ErrorName: error.name, ErrorCode: error.code, ErrorData: error.data }));
                        console.log(`Job ${job.title} failed. Error: `, error);
                    } finally {
                        done();
                    }
                }, function (error: any, ret: any) {
                    if (error) {
                        logger.error(`Job ${job.title} failed. {Error}`, stringify({ ErorMessage: error.message, ErrorStack: error.stack, ErrorName: error.name, ErrorCode: error.code, ErrorData: error.data }));
                        console.log(`Job ${job.title} failed. Error: `, error);
                    }
                });
            });
        }
    }
}