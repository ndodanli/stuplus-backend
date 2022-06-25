import AsyncLock from "async-lock";

export default interface IBaseCronJob {
    title: string;
    description: string;
    cronExpression: string;
    customLock?: AsyncLock;
    customLockKey?: string;
    run(): Promise<void>;
}
