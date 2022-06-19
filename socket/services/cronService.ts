import cron from "node-cron"
import { RedisPMOperationType, RedisOperationType, RedisGMOperationType } from "../../stuplus-lib/enums/enums_socket";
import { GroupMessageEntity, GroupMessageForwardEntity, GroupMessageReadEntity, MessageEntity } from "../../stuplus-lib/entities/BaseEntity";
import { RedisClientType } from "../server";
import AsyncLock from "async-lock"
import { RedisMessageReceiptUpdateDTO } from "../dtos/RedisChat";
import { config } from "../config/config";
var lock = new AsyncLock();

export default class CronService {
    static init(redisClient: RedisClientType): void {
        cron.schedule(`*/5 * * * * *`, async () => {
            lock.acquire("redis-db-operations", async function (done: any) {
                const requiredKeys = await redisClient.scan(0, { MATCH: "*", COUNT: 10 });
                for (let i = 0; i < requiredKeys.keys.length; i++) {
                    const currentKey = requiredKeys.keys[i];
                    if (currentKey.startsWith(RedisOperationType.PrivateMessage)) {
                        await handlePMOperations(redisClient, currentKey);
                    } else if (currentKey.startsWith(RedisOperationType.GroupMessage)) {
                        await handleGroupMessageOperations(redisClient, currentKey);
                    }
                }
                done();
            }, function (err, ret) {
                if (err) console.log(err)
            });
        });

        async function handlePMOperations(redisClient: RedisClientType, currentKey: string) {
            return new Promise(async (resolve, reject) => {
                const data = await redisClient.lRange(currentKey, 0, -1);
                const privateMessageBatches: Array<Array<object>> = [];
                const readedBatches: Array<Array<RedisMessageReceiptUpdateDTO>> = [];
                const forwardedBatches: Array<Array<RedisMessageReceiptUpdateDTO>> = [];
                const batchSize = config.pmBatchSize;
                let iterator = 0;
                for (let i = 0; i < data.length; i += batchSize) {
                    const currentBatch = data.slice(i, i + batchSize);
                    privateMessageBatches[iterator] = new Array<object>();
                    readedBatches[iterator] = new Array<RedisMessageReceiptUpdateDTO>();
                    forwardedBatches[iterator] = new Array<RedisMessageReceiptUpdateDTO>();
                    for (let j = 0; j < currentBatch.length; j++) {
                        const query: any = currentBatch[j].toJSONObject();
                        switch (query.t) {
                            case RedisPMOperationType.InsertMessage:
                                privateMessageBatches[iterator].push(query.e);
                                break;
                            case RedisPMOperationType.UpdateReaded:
                                readedBatches[iterator].push({ ...query.e, readed: true });
                                break;
                            case RedisPMOperationType.UpdateForwarded:
                                forwardedBatches[iterator].push({ ...query.e, forwarded: true });
                                break;
                            default:
                                break;
                        }
                    }
                    iterator++;
                }
                if (privateMessageBatches.length > 0) {
                    for (let i = 0; i < privateMessageBatches.length; i++) {
                        if (privateMessageBatches[i].length > 0) {
                            console.time("PM insertMessage Bulk operation time");
                            await MessageEntity.insertMany(privateMessageBatches[i]);
                            console.timeEnd("PM insertMessage Bulk operation time");
                        }
                    }
                }

                if (forwardedBatches.length > 0) {
                    for (let i = 0; i < forwardedBatches.length; i++) {
                        if (forwardedBatches[i].length > 0) {
                            console.time("PM updateForwarded Bulk operation time");
                            const bulkForwardUpdateOp = forwardedBatches[i].map(obj => {
                                return {
                                    updateOne: {
                                        filter: {
                                            _id: obj._id
                                        },

                                        update: {
                                            forwarded: true
                                        }
                                    }
                                }
                            })
                            await MessageEntity.bulkWrite(bulkForwardUpdateOp);
                            console.timeEnd("PM updateForwarded Bulk operation time");
                        }
                    }
                }

                if (readedBatches.length > 0) {
                    for (let i = 0; i < readedBatches.length; i++) {
                        if (readedBatches[i].length > 0) {
                            console.time("PM updateReaded Bulk operation time");
                            const bulkForwardUpdateOp = readedBatches[i].map(obj => {
                                return {
                                    updateOne: {
                                        filter: {
                                            _id: obj._id
                                        },

                                        update: {
                                            readed: true
                                        }
                                    }
                                }
                            })
                            await MessageEntity.bulkWrite(bulkForwardUpdateOp);
                            console.timeEnd("PM updateReaded Bulk operation time");

                        }
                    }
                }

                await redisClient.lTrim(currentKey, data.length, -1);
                resolve(true);
            });

        }
        async function handleGroupMessageOperations(redisClient: RedisClientType, currentKey: string) {
            return new Promise(async (resolve, reject) => {
                const data = await redisClient.lRange(currentKey, 0, -1);
                const groupMessageBatches: Array<Array<object>> = [];
                const readedBatches: Array<Array<object>> = [];
                const forwardedBatches: Array<Array<object>> = [];
                const batchSize = config.gmBatchSize;
                let iterator = 0;
                for (let i = 0; i < data.length; i += batchSize) {
                    const currentBatch = data.slice(i, i + batchSize);
                    groupMessageBatches[iterator] = new Array<object>();
                    readedBatches[iterator] = new Array<object>();
                    forwardedBatches[iterator] = new Array<object>();
                    for (let j = 0; j < currentBatch.length; j++) {
                        const query: any = currentBatch[j].toJSONObject();
                        switch (query.t) {
                            case RedisGMOperationType.InsertMessage:
                                groupMessageBatches[iterator].push(query.e);
                                break;
                            case RedisGMOperationType.InsertReaded:
                                readedBatches[iterator].push(query.e);
                                break;
                            case RedisGMOperationType.InsertForwarded:
                                forwardedBatches[iterator].push(query.e);
                                break;
                            default:
                                break;
                        }
                    }
                    iterator++;
                }
                if (groupMessageBatches.length > 0) {
                    for (let i = 0; i < groupMessageBatches.length; i++) {
                        if (groupMessageBatches[i].length > 0) {
                            console.time("GM insertMessage Bulk operation time");
                            await GroupMessageEntity.insertMany(groupMessageBatches[i]);
                            console.timeEnd("GM insertMessage Bulk operation time");
                        }
                    }
                }

                if (forwardedBatches.length > 0) {
                    for (let i = 0; i < forwardedBatches.length; i++) {
                        if (forwardedBatches[i].length > 0) {
                            console.time("GM insertForwarded Bulk operation time");
                            await GroupMessageForwardEntity.insertMany(forwardedBatches[i]);
                            console.timeEnd("GM insertForwarded Bulk operation time");
                        }
                    }
                }

                if (readedBatches.length > 0) {
                    for (let i = 0; i < readedBatches.length; i++) {
                        if (readedBatches[i].length > 0) {
                            console.time("GM insertReaded Bulk operation time");
                            await GroupMessageReadEntity.insertMany(readedBatches[i]);
                            console.timeEnd("GM insertReaded Bulk operation time");
                        }
                    }
                }

                await redisClient.lTrim(currentKey, data.length, -1);
                resolve(true);
            });
        }
    }
}