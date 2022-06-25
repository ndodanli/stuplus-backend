import AsyncLock from "async-lock";

export default interface IBaseCronJob {
    title: string;
    description: string;
    cronExpression: string;
    customLock?: AsyncLock;
    run(): Promise<void>;
}
