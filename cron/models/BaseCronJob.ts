import AsyncLock from "async-lock";

export default interface IBaseCronJob {
    cronExpression: string;
    customLock?: AsyncLock;
    run(): Promise<void>;
}
