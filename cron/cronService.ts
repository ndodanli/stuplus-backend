import cron from "node-cron"
import AsyncLock from "async-lock"
import IBaseCronJob from "./jobs/IBaseCronJob";
import logger from "./config/logger";
import { stringify } from "../stuplus-lib/utils/general";
export default class CronService {
    private static lock = new AsyncLock({ timeout: 15000 });

    static init(jobs: Array<IBaseCronJob>): void {
        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];
            let jobLock: AsyncLock;
            if (job.customLock) {
                jobLock = job.customLock;
            } else {
                jobLock = CronService.lock;
            }
            const lockKey = job.customLockKey ? job.customLockKey : job.constructor.name;
            const cronJob = cron.schedule(job.cronExpression, async () => {
                if (jobLock.isBusy(lockKey)) {
                    logger.info(`${job.title} is busy.`);
                    console.info(`[${new Date()}]${job.title} is busy.`);
                    return;
                }
                jobLock.acquire(lockKey, async function (done: any) {
                    try {
                        await job.run();
                        done();
                    } catch (error: any) {
                        logger.error({ err: error }, `Job ${job.title} failed. {Data}`, stringify({ ErorMessage: error.message }));
                        console.log(`Job ${job.title} failed. Error: `, error);
                        done();
                    } finally {
                        done();
                    }
                }, function (error: any, ret: any) {
                    if (error) {
                        logger.error({ err: error }, `Job ${job.title} failed. {Data}`, stringify({ ErorMessage: error.message }));
                        console.log(`Job ${job.title} failed. Error: `, error);
                    }
                });
            });
            cronJob.start();
        }
    }
}