import AsyncLock from "async-lock";
import { RedisMessageReceiptUpdateDTO } from "../../api/socket/dtos/RedisChat";
import { config } from "../../stuplus-lib/config/config";
import { AnnouncementCommentEntity, AnnouncementCommentLikeEntity, AnnouncementLikeEntity, GroupMessageEntity, GroupMessageForwardEntity, GroupMessageReadEntity, MessageEntity } from "../../stuplus-lib/entities/BaseEntity";
import { LikeType } from "../../stuplus-lib/enums/enums";
import { RedisGMOperationType, RedisKeyType, RedisPMOperationType } from "../../stuplus-lib/enums/enums_socket";
import RedisService from "../../stuplus-lib/services/redisService";
import IBaseCronJob from "./IBaseCronJob";

export default class RedisDatabaseJob implements IBaseCronJob {
    cronExpression: string;
    customLock?: AsyncLock | undefined;
    customLockKey?: string;
    title: string;
    description: string;
    static currentCursor: number = 0;
    /**
     *
     */
    constructor({ cronExpression, customLock, customLockKey, title, description }: { cronExpression: string, customLock?: AsyncLock | undefined, customLockKey: string, title: string, description: string }) {
        this.cronExpression = cronExpression;
        this.customLock = customLock;
        this.customLockKey = customLockKey;
        this.title = title;
        this.description = description;
    }
    async run(): Promise<void> {
        console.log("RedisDatabaseJob Cron job started");
        do {
            const { keys, cursor } = await RedisService.client.scan(RedisDatabaseJob.currentCursor, { MATCH: "*", COUNT: 100 });
            RedisDatabaseJob.currentCursor = cursor;
            for (let i = 0; i < keys.length; i++) {
                const currentKey = keys[i];
                if (currentKey.startsWith(RedisKeyType.DBPrivateMessage)) {
                    await handlePMOperations(currentKey);
                } else if (currentKey.startsWith(RedisKeyType.DBGroupMessage)) {
                    await handleGroupMessageOperations(currentKey);
                } else if (currentKey.startsWith(RedisKeyType.DBAnnouncementLike)) {
                    await handleAnnouncementLikeOperations(currentKey);
                } else if (currentKey.startsWith(RedisKeyType.DBAnnouncementDislike)) {
                    await handleAnnouncementDislikeOperations(currentKey);
                } else if (currentKey.startsWith(RedisKeyType.DBAnnouncementComment)) {
                    await handleAnnouncementCommentOperations(currentKey);
                } else if (currentKey.startsWith(RedisKeyType.DBAnnouncementCommentLike)) {
                    await handleAnnouncementCommentLikeOperations(currentKey);
                }else if (currentKey.startsWith(RedisKeyType.DBAnnouncementCommentDislike)) {
                    await handleAnnouncementCommentDislikeOperations(currentKey);
                }
            }
            console.log("RedisDatabaseJob Cron job finished");
        } while (RedisDatabaseJob.currentCursor != 0);

        async function handlePMOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                const data = await RedisService.client.lRange(currentKey, 0, -1);
                const privateMessageBatches: Array<Array<object>> = [];
                const readedBatches: Array<Array<RedisMessageReceiptUpdateDTO>> = [];
                const forwardedBatches: Array<Array<RedisMessageReceiptUpdateDTO>> = [];
                const batchSize = config.BATCH_SIZES.PM_BATCH_SIZE;
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

                await RedisService.client.lTrim(currentKey, data.length, -1);
                resolve(true);
            });

        }
        async function handleGroupMessageOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                const data = await RedisService.client.lRange(currentKey, 0, -1);
                const groupMessageBatches: Array<Array<object>> = [];
                const readedBatches: Array<Array<object>> = [];
                const forwardedBatches: Array<Array<object>> = [];
                const batchSize = config.BATCH_SIZES.GM_BATCH_SIZE;
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

                await RedisService.client.lTrim(currentKey, data.length, -1);
                resolve(true);
            });
        }
        async function handleAnnouncementLikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                const data = await RedisService.client.lRange(currentKey, 0, -1);
                const announcementLikeBatches: Array<Array<object>> = [];
                const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_LD_BATCH_SIZE;
                let iterator = 0;
                for (let i = 0; i < data.length; i += batchSize) {
                    const currentBatch = data.slice(i, i + batchSize);
                    announcementLikeBatches[iterator] = new Array<object>();
                    for (let j = 0; j < currentBatch.length; j++) {
                        const query: any = currentBatch[j].toJSONObject();
                        announcementLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                    }
                    iterator++;
                }
                if (announcementLikeBatches.length > 0) {
                    for (let i = 0; i < announcementLikeBatches.length; i++) {
                        if (announcementLikeBatches[i].length > 0) {
                            console.time("Announcement Like insertBulk operation time");
                            await AnnouncementLikeEntity.insertMany(announcementLikeBatches[i]);
                            console.timeEnd("Announcement Like insertBulk operation time");
                        }
                    }
                }
                await RedisService.client.lTrim(currentKey, data.length, -1);
                resolve(true);
            });
        }
        async function handleAnnouncementDislikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                const data = await RedisService.client.lRange(currentKey, 0, -1);
                const announcementDislikeBatches: Array<Array<object>> = [];
                const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_LD_BATCH_SIZE;
                let iterator = 0;
                for (let i = 0; i < data.length; i += batchSize) {
                    const currentBatch = data.slice(i, i + batchSize);
                    announcementDislikeBatches[iterator] = new Array<object>();
                    for (let j = 0; j < currentBatch.length; j++) {
                        const query: any = currentBatch[j].toJSONObject();
                        announcementDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                    }
                    iterator++;
                }
                if (announcementDislikeBatches.length > 0) {
                    for (let i = 0; i < announcementDislikeBatches.length; i++) {
                        if (announcementDislikeBatches[i].length > 0) {
                            console.time("Announcement Dislike insertBulk operation time");
                            await AnnouncementLikeEntity.insertMany(announcementDislikeBatches[i]);
                            console.timeEnd("Announcement Dislike insertBulk operation time");
                        }
                    }
                }
                await RedisService.client.lTrim(currentKey, data.length, -1);
                resolve(true);
            });
        }
        async function handleAnnouncementCommentOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                const data = await RedisService.client.lRange(currentKey, 0, -1);
                const announcementCommentBatches: Array<Array<object>> = [];
                const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_BATCH_SIZE;
                let iterator = 0;
                for (let i = 0; i < data.length; i += batchSize) {
                    const currentBatch = data.slice(i, i + batchSize);
                    announcementCommentBatches[iterator] = new Array<object>();
                    for (let j = 0; j < currentBatch.length; j++) {
                        const query: any = currentBatch[j].toJSONObject();
                        announcementCommentBatches[iterator].push(query.e);
                    }
                    iterator++;
                }
                if (announcementCommentBatches.length > 0) {
                    for (let i = 0; i < announcementCommentBatches.length; i++) {
                        if (announcementCommentBatches[i].length > 0) {
                            console.time("Announcement Comment insertBulk operation time");
                            await AnnouncementCommentEntity.insertMany(announcementCommentBatches[i]);
                            console.timeEnd("Announcement Comment insertBulk operation time");
                        }
                    }
                }
                await RedisService.client.lTrim(currentKey, data.length, -1);
                resolve(true);
            });
        }
        async function handleAnnouncementCommentLikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                const data = await RedisService.client.lRange(currentKey, 0, -1);
                const announcementCommentLikeBatches: Array<Array<object>> = [];
                const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                let iterator = 0;
                for (let i = 0; i < data.length; i += batchSize) {
                    const currentBatch = data.slice(i, i + batchSize);
                    announcementCommentLikeBatches[iterator] = new Array<object>();
                    for (let j = 0; j < currentBatch.length; j++) {
                        const query: any = currentBatch[j].toJSONObject();
                        announcementCommentLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                    }
                    iterator++;
                }
                if (announcementCommentLikeBatches.length > 0) {
                    for (let i = 0; i < announcementCommentLikeBatches.length; i++) {
                        if (announcementCommentLikeBatches[i].length > 0) {
                            console.time("Announcement Comment Like insertBulk operation time");
                            await AnnouncementCommentLikeEntity.insertMany(announcementCommentLikeBatches[i]);
                            console.timeEnd("Announcement Comment Like insertBulk operation time");
                        }
                    }
                }
                await RedisService.client.lTrim(currentKey, data.length, -1);
                resolve(true);
            });
        }
        async function handleAnnouncementCommentDislikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                const data = await RedisService.client.lRange(currentKey, 0, -1);
                const announcementCommentDislikeBatches: Array<Array<object>> = [];
                const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                let iterator = 0;
                for (let i = 0; i < data.length; i += batchSize) {
                    const currentBatch = data.slice(i, i + batchSize);
                    announcementCommentDislikeBatches[iterator] = new Array<object>();
                    for (let j = 0; j < currentBatch.length; j++) {
                        const query: any = currentBatch[j].toJSONObject();
                        announcementCommentDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                    }
                    iterator++;
                }
                if (announcementCommentDislikeBatches.length > 0) {
                    for (let i = 0; i < announcementCommentDislikeBatches.length; i++) {
                        if (announcementCommentDislikeBatches[i].length > 0) {
                            console.time("Announcement Comment Dislike insertBulk operation time");
                            await AnnouncementCommentLikeEntity.insertMany(announcementCommentDislikeBatches[i]);
                            console.timeEnd("Announcement Comment Dislike insertBulk operation time");
                        }
                    }
                }
                await RedisService.client.lTrim(currentKey, data.length, -1);
                resolve(true);
            });
        }
    }
}