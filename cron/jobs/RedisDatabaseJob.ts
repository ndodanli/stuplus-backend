import AsyncLock from "async-lock";
import { RedisFileMessageUpdateDTO, RedisMessageReceiptUpdateDTO } from "../../stuplus.api/socket/dtos/RedisChat";
import { config } from "../../stuplus-lib/config/config";
import { AnnouncementCommentEntity, AnnouncementCommentLikeEntity, AnnouncementLikeEntity, GroupMessageEntity, GroupMessageForwardEntity, GroupMessageReadEntity, HashtagEntity, MessageEntity, QuestionCommentEntity, QuestionCommentLikeEntity, QuestionLikeEntity, QuestionSubCommentEntity, QuestionSubCommentLikeEntity, SearchHistoryEntity } from "../../stuplus-lib/entities/BaseEntity";
import { LikeType } from "../../stuplus-lib/enums/enums";
import { RedisGMOperationType, RedisKeyType, RedisPMOperationType } from "../../stuplus-lib/enums/enums_socket";
import RedisService from "../../stuplus-lib/services/redisService";
import IBaseCronJob from "./IBaseCronJob";
import { chunk, stringify } from "../../stuplus-lib/utils/general";
import logger from "../../stuplus-lib/config/logger";

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
        const totalKeySize = await RedisService.client.dbSize();
        let currentKeySize = 0;
        try {
            console.time("scan")
            do {
                const { keys, cursor } = await RedisService.client.scan(RedisDatabaseJob.currentCursor, { MATCH: "d*", COUNT: 200 });
                RedisDatabaseJob.currentCursor = cursor;
                if (keys.length > 0) {
                    currentKeySize += keys.length;
                    const operations = [];
                    for (let i = 0; i < keys.length; i++) {
                        const currentKey = keys[i];
                        if (currentKey.startsWith(RedisKeyType.DBPrivateMessage)) {
                            operations.push({
                                func: handlePMOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBGroupMessage)) {
                            operations.push({
                                func: handleGroupMessageOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBAnnouncementLike)) {
                            operations.push({
                                func: handleAnnouncementLikeOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBAnnouncementDislike)) {
                            operations.push({
                                func: handleAnnouncementDislikeOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBAnnouncementComment)) {
                            operations.push({
                                func: handleAnnouncementCommentOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBAnnouncementCommentLike)) {
                            operations.push({
                                func: handleAnnouncementCommentLikeOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBAnnouncementCommentDislike)) {
                            operations.push({
                                func: handleAnnouncementCommentDislikeOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBQuestionLike)) {
                            operations.push({
                                func: handleQuestionLikeOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBQuestionDislike)) {
                            operations.push({
                                func: handleQuestionDislikeOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBQuestionComment)) {
                            operations.push({
                                func: handleQuestionCommentOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBQuestionCommentLike)) {
                            operations.push({
                                func: handleQuestionCommentLikeOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBQuestionCommentDislike)) {
                            operations.push({
                                func: handleQuestionCommentDislikeOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBQuestionSubComment)) {
                            operations.push({
                                func: handleQuestionSubCommentOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBQuestionSubCommentLike)) {
                            operations.push({
                                func: handleQuestionSubCommentLikeOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBQuestionSubCommentDislike)) {
                            operations.push({
                                func: handleQuestionSubCommentDislikeOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBSearchHistory)) {
                            operations.push({
                                func: handleSearchHistoryOperations,
                                arg1: currentKey,
                            });
                        } else if (currentKey.startsWith(RedisKeyType.DBHashtagEntity)) {
                            operations.push({
                                func: handleHashtagOperations,
                                arg1: currentKey,
                            });
                        }
                    }
                    if (operations.length > 0) {
                        const operationChunks = chunk(operations, 10);
                        for (let i = 0; i < operationChunks.length; i++) {
                            const result = await Promise.allSettled(operationChunks[i].map(async (operation) => {
                                await operation.func(operation.arg1);
                            }))
                        }
                    }
                }
            } while (RedisDatabaseJob.currentCursor != 0 && currentKeySize < totalKeySize);
            console.timeEnd("scan")

            console.log("RedisDatabaseJob Cron job finished");
        } catch (error) {
            console.log("RedisDatabaseJob Cron job error", error);
        }
        async function handleHashtagOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const hashtag: any = currentKey.split(":")[1];
                    const groupPopularityKey = RedisKeyType.DBHashtagGroupPopularityIncr + `${hashtag}:groupPopularity`;
                    const questionPopularityKey = RedisKeyType.DBHashtagGroupPopularityIncr + `${hashtag}:questionPopularity`;
                    const annoPopularityKey = RedisKeyType.DBHashtagGroupPopularityIncr + `${hashtag}:annoPopularity`;
                    const overallPopularityKey = RedisKeyType.DBHashtagEntity + hashtag;
                    let groupPopularity = await RedisService.client.get(groupPopularityKey).then(x => parseInt(x ?? "0"));
                    let questionPopularity = await RedisService.client.get(questionPopularityKey).then(x => parseInt(x ?? "0"));
                    let annoPopularity = await RedisService.client.get(annoPopularityKey).then(x => parseInt(x ?? "0"));
                    let overallPopularity = await RedisService.client.get(overallPopularityKey).then(x => parseInt(x ?? "0"));
                    await HashtagEntity.findOneAndUpdate(
                        { tag: hashtag },
                        {
                            tag: hashtag,
                            $inc: {
                                groupPopularity: groupPopularity,
                                questionPopularity: questionPopularity,
                                annoPopularity: annoPopularity,
                                overallPopularity: overallPopularity
                            }
                        },
                        { upsert: true });
                    await RedisService.client.del(groupPopularityKey);
                    await RedisService.client.del(questionPopularityKey);
                    await RedisService.client.del(annoPopularityKey);
                    await RedisService.client.del(overallPopularityKey);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleHashtagOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleHashtagOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleSearchHistoryOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.lRange(currentKey, 0, -1);
                    const searchHistoryBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.PM_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        searchHistoryBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            searchHistoryBatches[iterator].push(query.e);
                        }
                        iterator++;
                    }
                    if (searchHistoryBatches.length > 0) {
                        for (let i = 0; i < searchHistoryBatches.length; i++) {
                            if (searchHistoryBatches[i].length > 0) {
                                // console.time("Searched History insertSH Bulk operation time. order: " + i);
                                await SearchHistoryEntity.insertMany(searchHistoryBatches[i]);
                                // console.timeEnd("Searched History insertSH Bulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.lTrim(currentKey, data.length, -1);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleSearchHistoryOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleSearchHistoryOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handlePMOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const privateMessageBatches: Array<Array<object>> = [];
                    const readedBatches: Array<Array<RedisMessageReceiptUpdateDTO>> = [];
                    const forwardedBatches: Array<Array<RedisMessageReceiptUpdateDTO>> = [];
                    const updateSendFileBatches: Array<Array<RedisFileMessageUpdateDTO>> = [];
                    const batchSize = config.BATCH_SIZES.PM_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        privateMessageBatches[iterator] = new Array<object>();
                        readedBatches[iterator] = new Array<RedisMessageReceiptUpdateDTO>();
                        forwardedBatches[iterator] = new Array<RedisMessageReceiptUpdateDTO>();
                        updateSendFileBatches[iterator] = new Array<RedisFileMessageUpdateDTO>();
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
                                case RedisPMOperationType.UpdateSendFileMessage:
                                    updateSendFileBatches[iterator].push(query.e);
                                    break;
                                default:
                                    break;
                            }
                            keysToDelete.push(query.e._id + query.t);
                        }
                        iterator++;
                    }
                    if (privateMessageBatches.length > 0) {
                        for (let i = 0; i < privateMessageBatches.length; i++) {
                            if (privateMessageBatches[i].length > 0) {
                                // console.time("PM insertMessage Bulk operation time. order: " + i);
                                await MessageEntity.insertMany(privateMessageBatches[i]);
                                // console.timeEnd("PM insertMessage Bulk operation time. order: " + i);
                            }
                        }
                    }

                    if (forwardedBatches.length > 0) {
                        for (let i = 0; i < forwardedBatches.length; i++) {
                            if (forwardedBatches[i].length > 0) {
                                // console.time("PM updateForwarded Bulk operation time. order: " + i);
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
                                // console.timeEnd("PM updateForwarded Bulk operation time. order: " + i);
                            }
                        }
                    }

                    if (readedBatches.length > 0) {
                        for (let i = 0; i < readedBatches.length; i++) {
                            if (readedBatches[i].length > 0) {
                                // console.time("PM updateReaded Bulk operation time. order: " + i);
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
                                // console.timeEnd("PM updateReaded Bulk operation time. order: " + i);

                            }
                        }
                    }

                    if (updateSendFileBatches.length > 0) {
                        for (let i = 0; i < updateSendFileBatches.length; i++) {
                            if (updateSendFileBatches[i].length > 0) {
                                // console.time("PM updateSendFile Bulk operation time. order: " + i);
                                const bulkForwardUpdateOp = updateSendFileBatches[i].map(obj => {
                                    return {
                                        updateOne: {
                                            filter: {
                                                _id: obj.mi
                                            },

                                            update: {
                                                $push: {
                                                    "files": obj.file
                                                }
                                            }
                                        }
                                    }
                                });
                                await MessageEntity.bulkWrite(bulkForwardUpdateOp);
                                // console.timeEnd("PM updateSendFile Bulk operation time. order: " + i);

                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);

                    resolve(true);

                } catch (err: any) {
                    logger.error({ err: err }, `handlePMOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handlePMOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleGroupMessageOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const groupMessageBatches: Array<Array<object>> = [];
                    const readedBatches: Array<Array<object>> = [];
                    const forwardedBatches: Array<Array<object>> = [];
                    const updateSendFileBatches: Array<Array<RedisFileMessageUpdateDTO>> = [];
                    const batchSize = config.BATCH_SIZES.GM_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        groupMessageBatches[iterator] = new Array<object>();
                        readedBatches[iterator] = new Array<object>();
                        forwardedBatches[iterator] = new Array<object>();
                        updateSendFileBatches[iterator] = new Array<RedisFileMessageUpdateDTO>();
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
                                case RedisGMOperationType.UpdateSendFileMessage:
                                    updateSendFileBatches[iterator].push(query.e);
                                    break;
                                default:
                                    break;
                            }
                            keysToDelete.push(query.e._id + query.t);
                        }
                        iterator++;
                    }
                    if (groupMessageBatches.length > 0) {
                        for (let i = 0; i < groupMessageBatches.length; i++) {
                            if (groupMessageBatches[i].length > 0) {
                                // console.time("GM insertMessage Bulk operation time. order: " + i);
                                await GroupMessageEntity.insertMany(groupMessageBatches[i]);
                                // console.timeEnd("GM insertMessage Bulk operation time. order: " + i);
                            }
                        }
                    }

                    if (forwardedBatches.length > 0) {
                        for (let i = 0; i < forwardedBatches.length; i++) {
                            if (forwardedBatches[i].length > 0) {
                                // console.time("GM insertForwarded Bulk operation time. order: " + i);
                                await GroupMessageForwardEntity.insertMany(forwardedBatches[i]);
                                // console.timeEnd("GM insertForwarded Bulk operation time. order: " + i);
                            }
                        }
                    }

                    if (readedBatches.length > 0) {
                        for (let i = 0; i < readedBatches.length; i++) {
                            if (readedBatches[i].length > 0) {
                                // console.time("GM insertReaded Bulk operation time. order: " + i);
                                await GroupMessageReadEntity.insertMany(readedBatches[i]);
                                // console.timeEnd("GM insertReaded Bulk operation time. order: " + i);
                            }
                        }
                    }

                    if (updateSendFileBatches.length > 0) {
                        for (let i = 0; i < updateSendFileBatches.length; i++) {
                            if (updateSendFileBatches[i].length > 0) {
                                // console.time("GM updateSendFile Bulk operation time. order: " + i);
                                const bulkForwardUpdateOp = updateSendFileBatches[i].map(obj => {
                                    return {
                                        updateOne: {
                                            filter: {
                                                _id: obj.mi
                                            },

                                            update: {
                                                $push: {
                                                    "files": obj.file
                                                }
                                            }
                                        }
                                    }
                                });
                                await GroupMessageEntity.bulkWrite(bulkForwardUpdateOp);
                                // console.timeEnd("GM updateSendFile Bulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleGroupMessageOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleGroupMessageOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleAnnouncementLikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const announcementLikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        announcementLikeBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            announcementLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                            keysToDelete.push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (announcementLikeBatches.length > 0) {
                        for (let i = 0; i < announcementLikeBatches.length; i++) {
                            if (announcementLikeBatches[i].length > 0) {
                                // console.time("Announcement Like insertBulk operation time. order: " + i);
                                await AnnouncementLikeEntity.insertMany(announcementLikeBatches[i]);
                                // console.timeEnd("Announcement Like insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleAnnouncementLikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleAnnouncementLikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleAnnouncementDislikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const announcementDislikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        announcementDislikeBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            announcementDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                            keysToDelete.push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (announcementDislikeBatches.length > 0) {
                        for (let i = 0; i < announcementDislikeBatches.length; i++) {
                            if (announcementDislikeBatches[i].length > 0) {
                                // console.time("Announcement Dislike insertBulk operation time. order: " + i);
                                await AnnouncementLikeEntity.insertMany(announcementDislikeBatches[i]);
                                // console.timeEnd("Announcement Dislike insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleAnnouncementDislikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleAnnouncementDislikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleAnnouncementCommentOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const announcementCommentBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        announcementCommentBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            announcementCommentBatches[iterator].push(query.e);
                            keysToDelete.push(query.e._id);
                        }
                        iterator++;
                    }
                    if (announcementCommentBatches.length > 0) {
                        for (let i = 0; i < announcementCommentBatches.length; i++) {
                            if (announcementCommentBatches[i].length > 0) {
                                // console.time("Announcement Comment insertBulk operation time. order: " + i);
                                await AnnouncementCommentEntity.insertMany(announcementCommentBatches[i]);
                                // console.timeEnd("Announcement Comment insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleAnnouncementCommentOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleAnnouncementCommentOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleAnnouncementCommentLikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const announcementCommentLikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        announcementCommentLikeBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            announcementCommentLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                            keysToDelete.push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (announcementCommentLikeBatches.length > 0) {
                        for (let i = 0; i < announcementCommentLikeBatches.length; i++) {
                            if (announcementCommentLikeBatches[i].length > 0) {
                                // console.time("Announcement Comment Like insertBulk operation time. order: " + i);
                                await AnnouncementCommentLikeEntity.insertMany(announcementCommentLikeBatches[i]);
                                // console.timeEnd("Announcement Comment Like insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleAnnouncementCommentLikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleAnnouncementCommentLikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleAnnouncementCommentDislikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const announcementCommentDislikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        announcementCommentDislikeBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            announcementCommentDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                            keysToDelete.push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (announcementCommentDislikeBatches.length > 0) {
                        for (let i = 0; i < announcementCommentDislikeBatches.length; i++) {
                            if (announcementCommentDislikeBatches[i].length > 0) {
                                // console.time("Announcement Comment Dislike insertBulk operation time. order: " + i);
                                await AnnouncementCommentLikeEntity.insertMany(announcementCommentDislikeBatches[i]);
                                // console.timeEnd("Announcement Comment Dislike insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleAnnouncementCommentDislikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleAnnouncementCommentDislikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleQuestionLikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const questionLikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionLikeBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                            keysToDelete.push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionLikeBatches.length > 0) {
                        for (let i = 0; i < questionLikeBatches.length; i++) {
                            if (questionLikeBatches[i].length > 0) {
                                // console.time("Question Like insertBulk operation time. order: " + i);
                                await QuestionLikeEntity.insertMany(questionLikeBatches[i]);
                                // console.timeEnd("Question Like insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleQuestionLikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleQuestionLikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleQuestionDislikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const questionDislikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionDislikeBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                            keysToDelete.push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionDislikeBatches.length > 0) {
                        for (let i = 0; i < questionDislikeBatches.length; i++) {
                            if (questionDislikeBatches[i].length > 0) {
                                // console.time("Question Dislike insertBulk operation time. order: " + i);
                                await QuestionLikeEntity.insertMany(questionDislikeBatches[i]);
                                // console.timeEnd("Question Dislike insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleQuestionDislikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleQuestionDislikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleQuestionCommentOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const questionCommentBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionCommentBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionCommentBatches[iterator].push(query.e);
                            keysToDelete.push(query.e._id);
                        }
                        iterator++;
                    }
                    if (questionCommentBatches.length > 0) {
                        for (let i = 0; i < questionCommentBatches.length; i++) {
                            if (questionCommentBatches[i].length > 0) {
                                // console.time("Question Comment insertBulk operation time. order: " + i);
                                await QuestionCommentEntity.insertMany(questionCommentBatches[i]);
                                // console.timeEnd("Question Comment insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleQuestionCommentOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleQuestionCommentOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleQuestionCommentLikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const questionCommentLikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionCommentLikeBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionCommentLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                            keysToDelete.push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionCommentLikeBatches.length > 0) {
                        for (let i = 0; i < questionCommentLikeBatches.length; i++) {
                            if (questionCommentLikeBatches[i].length > 0) {
                                // console.time("Question Comment Like insertBulk operation time. order: " + i);
                                await QuestionCommentLikeEntity.insertMany(questionCommentLikeBatches[i]);
                                // console.timeEnd("Question Comment Like insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleQuestionCommentLikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleQuestionCommentLikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleQuestionCommentDislikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const questionCommentDislikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionCommentDislikeBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionCommentDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                            keysToDelete.push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionCommentDislikeBatches.length > 0) {
                        for (let i = 0; i < questionCommentDislikeBatches.length; i++) {
                            if (questionCommentDislikeBatches[i].length > 0) {
                                // console.time("Question Comment Dislike insertBulk operation time. order: " + i);
                                await QuestionCommentLikeEntity.insertMany(questionCommentDislikeBatches[i]);
                                // console.timeEnd("Question Comment Dislike insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleQuestionCommentDislikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleQuestionCommentDislikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleQuestionSubCommentOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const questionSubCommentBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionSubCommentBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionSubCommentBatches[iterator].push(query.e);
                            keysToDelete.push(query.e._id);
                        }
                        iterator++;
                    }
                    if (questionSubCommentBatches.length > 0) {
                        for (let i = 0; i < questionSubCommentBatches.length; i++) {
                            if (questionSubCommentBatches[i].length > 0) {
                                // console.time("Question SubComment insertBulk operation time. order: " + i);
                                await QuestionSubCommentEntity.insertMany(questionSubCommentBatches[i]);
                                // console.timeEnd("Question SubComment insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleQuestionSubCommentOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleQuestionSubCommentOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleQuestionSubCommentLikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const questionSubCommentLikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionSubCommentLikeBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionSubCommentLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                            keysToDelete.push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionSubCommentLikeBatches.length > 0) {
                        for (let i = 0; i < questionSubCommentLikeBatches.length; i++) {
                            if (questionSubCommentLikeBatches[i].length > 0) {
                                // console.time("Question SubComment Like insertBulk operation time. order: " + i);
                                await QuestionSubCommentLikeEntity.insertMany(questionSubCommentLikeBatches[i]);
                                // console.timeEnd("Question SubComment Like insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleQuestionSubCommentLikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleQuestionSubCommentLikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
        async function handleQuestionSubCommentDislikeOperations(currentKey: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete = new Array<string>();
                    const questionSubCommentDislikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionSubCommentDislikeBatches[iterator] = new Array<object>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionSubCommentDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                            keysToDelete.push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionSubCommentDislikeBatches.length > 0) {
                        for (let i = 0; i < questionSubCommentDislikeBatches.length; i++) {
                            if (questionSubCommentDislikeBatches[i].length > 0) {
                                // console.time("Question SubComment Dislike insertBulk operation time. order: " + i);
                                await QuestionCommentLikeEntity.insertMany(questionSubCommentDislikeBatches[i]);
                                // console.timeEnd("Question SubComment Dislike insertBulk operation time. order: " + i);
                            }
                        }
                    }
                    await RedisService.client.hDel(currentKey, keysToDelete);
                    resolve(true);
                } catch (err: any) {
                    logger.error({ err: err }, `handleQuestionSubCommentDislikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    console.error({ err: err }, `[${new Date()}]handleQuestionSubCommentDislikeOperations failed. {Data}`, stringify({ CurrentKey: currentKey, ErorMessage: err.message }));
                    reject(err);
                }
            });
        }
    }
}