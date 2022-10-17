import AsyncLock from "async-lock";
import { config } from "../../../stuplus-lib/config/config";
import logger from "../../../stuplus-lib/config/logger";
import { HashtagEntity, SearchHistoryEntity, MessageEntity, GroupMessageEntity, GroupMessageForwardEntity, GroupMessageReadEntity, AnnouncementLikeEntity, AnnouncementCommentEntity, AnnouncementCommentLikeEntity, QuestionLikeEntity, QuestionCommentEntity, QuestionCommentLikeEntity, QuestionSubCommentEntity, QuestionSubCommentLikeEntity } from "../../../stuplus-lib/entities/BaseEntity";
import { LikeType } from "../../../stuplus-lib/enums/enums";
import { RedisKeyType, RedisPMOperationType, RedisGMOperationType } from "../../../stuplus-lib/enums/enums_socket";
import RedisService from "../../../stuplus-lib/services/redisService";
import { chunk, stringify } from "../../../stuplus-lib/utils/general";
import { RedisMessageReceiptUpdateDTO, RedisFileMessageUpdateDTO } from "../../socket/dtos/RedisChat";
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
        // console.log("RedisDatabaseJob Cron job started");
        const totalKeySize = await RedisService.client.dbSize();
        let currentKeySize = 0;
        try {
            console.time("scan")
            do {
                // const { keys, cursor } = await RedisService.client.scan(RedisDatabaseJob.currentCursor, { MATCH: "d*", COUNT: 200 });
                const { keys, cursor } = await RedisService.client.scan(RedisDatabaseJob.currentCursor, { COUNT: 200 });
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

            // console.log("RedisDatabaseJob Cron job finished");
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
                    const data = await RedisService.client.hVals(currentKey);
                    const keysToDelete: {
                        searchHistoryBatches: string[][];
                    } = { searchHistoryBatches: [] };
                    const searchHistoryBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.PM_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        searchHistoryBatches[iterator] = new Array<object>();
                        keysToDelete.searchHistoryBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            searchHistoryBatches[iterator].push(query.e);
                            keysToDelete.searchHistoryBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (searchHistoryBatches.length > 0) {
                        for (let i = 0; i < searchHistoryBatches.length; i++) {
                            if (searchHistoryBatches[i].length > 0) {
                                // console.time("Searched History insertSH Bulk operation time. order: " + i);
                                await SearchHistoryEntity.insertMany(searchHistoryBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.searchHistoryBatches[i]);
                                // console.timeEnd("Searched History insertSH Bulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        privateMessageBatches: string[][], readedBatches: string[][], forwardedBatches: string[][], updateSendFileBatches: string[][]
                    } = { privateMessageBatches: [], readedBatches: [], forwardedBatches: [], updateSendFileBatches: [] };
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
                        keysToDelete.privateMessageBatches[iterator] = new Array<string>();
                        keysToDelete.readedBatches[iterator] = new Array<string>();
                        keysToDelete.forwardedBatches[iterator] = new Array<string>();
                        keysToDelete.updateSendFileBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            switch (query.t) {
                                case RedisPMOperationType.InsertMessage:
                                    privateMessageBatches[iterator].push(query.e);
                                    keysToDelete.privateMessageBatches[iterator].push(query.e._id + query.t);
                                    break;
                                case RedisPMOperationType.UpdateReaded:
                                    readedBatches[iterator].push(query.e);
                                    keysToDelete.readedBatches[iterator].push(query.e.ownerId + query.t);
                                    break;
                                case RedisPMOperationType.UpdateForwarded:
                                    forwardedBatches[iterator].push(query.e);
                                    keysToDelete.forwardedBatches[iterator].push(query.e.ownerId + query.t);
                                    break;
                                case RedisPMOperationType.UpdateSendFileMessage:
                                    updateSendFileBatches[iterator].push(query.e);
                                    keysToDelete.updateSendFileBatches[iterator].push(query.e._id + query.t);
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
                                // console.time("PM insertMessage Bulk operation time. order: " + i);
                                await MessageEntity.insertMany(privateMessageBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.privateMessageBatches[i]);
                                // console.timeEnd("PM insertMessage Bulk operation time. order: " + i);
                            }
                        }
                    }

                    if (forwardedBatches.length > 0) {
                        for (let i = 0; i < forwardedBatches.length; i++) {
                            for (let j = 0; j < forwardedBatches[i].length; j++) {
                                // console.time("PM updateForwarded Bulk operation time. order: " + i);
                                await MessageEntity.updateMany({ chatId: forwardedBatches[i][j].chatId, ownerId: { $ne: forwardedBatches[i][j].ownerId }, forwarded: false, createdAt: { $lte: forwardedBatches[i][j].createdAt } }, { forwarded: true });
                                await RedisService.client.hDel(currentKey, keysToDelete.forwardedBatches[i]);
                                // console.timeEnd("PM updateForwarded Bulk operation time. order: " + i);
                            }
                        }
                    }

                    if (readedBatches.length > 0) {
                        for (let i = 0; i < readedBatches.length; i++) {
                            for (let j = 0; j < readedBatches[i].length; j++) {
                                // console.time("PM updateReaded Bulk operation time. order: " + i);
                                await MessageEntity.updateMany({ chatId: readedBatches[i][j].chatId, ownerId: { $ne: readedBatches[i][j].ownerId }, readed: false, createdAt: { $lte: readedBatches[i][j].createdAt } }, { readed: true });
                                await RedisService.client.hDel(currentKey, keysToDelete.readedBatches[i]);
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
                                await RedisService.client.hDel(currentKey, keysToDelete.updateSendFileBatches[i]);
                                // console.timeEnd("PM updateSendFile Bulk operation time. order: " + i);
                            }
                        }
                    }

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
                    const keysToDelete: {
                        groupMessageBatches: string[][], readedBatches: string[][], forwardedBatches: string[][], updateSendFileBatches: string[][]
                    } = { groupMessageBatches: [], readedBatches: [], forwardedBatches: [], updateSendFileBatches: [] };
                    const groupMessageBatches: Array<Array<object>> = [];
                    const readedBatches: Array<Array<any>> = [];
                    const forwardedBatches: Array<Array<any>> = [];
                    const updateSendFileBatches: Array<Array<RedisFileMessageUpdateDTO>> = [];
                    const batchSize = config.BATCH_SIZES.GM_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        groupMessageBatches[iterator] = new Array<object>();
                        readedBatches[iterator] = new Array<any>();
                        forwardedBatches[iterator] = new Array<any>();
                        updateSendFileBatches[iterator] = new Array<RedisFileMessageUpdateDTO>();
                        keysToDelete.groupMessageBatches[iterator] = new Array<string>();
                        keysToDelete.readedBatches[iterator] = new Array<string>();
                        keysToDelete.forwardedBatches[iterator] = new Array<string>();
                        keysToDelete.updateSendFileBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            switch (query.t) {
                                case RedisGMOperationType.InsertMessage:
                                    groupMessageBatches[iterator].push(query.e);
                                    keysToDelete.groupMessageBatches[iterator].push(query.e._id + query.t);
                                    break;
                                case RedisGMOperationType.UpdateReaded:
                                    readedBatches[iterator].push(query.e);
                                    keysToDelete.readedBatches[iterator].push(query.e.readedBy + query.t);
                                    break;
                                case RedisGMOperationType.UpdateForwarded:
                                    forwardedBatches[iterator].push(query.e);
                                    keysToDelete.forwardedBatches[iterator].push(query.e.forwardedTo + query.t);
                                    break;
                                case RedisGMOperationType.UpdateSendFileMessage:
                                    updateSendFileBatches[iterator].push(query.e);
                                    keysToDelete.updateSendFileBatches[iterator].push(query.e._id + query.t);
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
                                // console.time("GM insertMessage Bulk operation time. order: " + i);
                                await GroupMessageEntity.insertMany(groupMessageBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.groupMessageBatches[i]);
                                // console.timeEnd("GM insertMessage Bulk operation time. order: " + i);
                            }
                        }
                    }

                    if (forwardedBatches.length > 0) {
                        for (let i = 0; i < forwardedBatches.length; i++) {
                            if (forwardedBatches[i].length > 0) {
                                // console.time("GM insertForwarded Bulk operation time. order: " + i);
                                const bulkForwardedOp = forwardedBatches[i].map(obj => {
                                    return {
                                        updateOne: {
                                            filter: {
                                                groupChatId: obj.groupChatId,
                                                forwardedTo: obj.forwardedTo
                                            },
                                            update: {
                                                lastForwardedAt: obj.lastForwardedAt,
                                            },
                                            upsert: true
                                        }
                                    }
                                });
                                await GroupMessageForwardEntity.bulkWrite(bulkForwardedOp);
                                await RedisService.client.hDel(currentKey, keysToDelete.forwardedBatches[i]);
                                // console.timeEnd("GM insertForwarded Bulk operation time. order: " + i);
                            }
                        }
                    }

                    if (readedBatches.length > 0) {
                        for (let i = 0; i < readedBatches.length; i++) {
                            if (readedBatches[i].length > 0) {
                                // console.time("GM insertReaded Bulk operation time. order: " + i);
                                const bulkReadedOp = readedBatches[i].map(obj => {
                                    return {
                                        updateOne: {
                                            filter: {
                                                groupChatId: obj.groupChatId,
                                                readedBy: obj.readedBy
                                            },
                                            update: {
                                                lastReadedAt: obj.lastReadedAt,
                                            },
                                            upsert: true
                                        }
                                    }
                                });
                                await GroupMessageReadEntity.bulkWrite(bulkReadedOp);
                                await RedisService.client.hDel(currentKey, keysToDelete.readedBatches[i]);
                                // console.timeEnd("GM insertReaded Bulk operation time. order: " + i);
                            }
                        }
                    }

                    if (updateSendFileBatches.length > 0) {
                        for (let i = 0; i < updateSendFileBatches.length; i++) {
                            if (updateSendFileBatches[i].length > 0) {
                                // console.time("GM updateSendFile Bulk operation time. order: " + i);
                                const bulkUpdateSendFileOp = updateSendFileBatches[i].map(obj => {
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
                                await GroupMessageEntity.bulkWrite(bulkUpdateSendFileOp);
                                await RedisService.client.hDel(currentKey, keysToDelete.updateSendFileBatches[i]);
                                // console.timeEnd("GM updateSendFile Bulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        announcementLikeBatches: string[][]
                    } = { announcementLikeBatches: [] };
                    const announcementLikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        announcementLikeBatches[iterator] = new Array<object>();
                        keysToDelete.announcementLikeBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            announcementLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                            keysToDelete.announcementLikeBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (announcementLikeBatches.length > 0) {
                        for (let i = 0; i < announcementLikeBatches.length; i++) {
                            if (announcementLikeBatches[i].length > 0) {
                                // console.time("Announcement Like insertBulk operation time. order: " + i);
                                await AnnouncementLikeEntity.insertMany(announcementLikeBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.announcementLikeBatches[i]);
                                // console.timeEnd("Announcement Like insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        announcementDislikeBatches: string[][]
                    } = { announcementDislikeBatches: [] };
                    const announcementDislikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        announcementDislikeBatches[iterator] = new Array<object>();
                        keysToDelete.announcementDislikeBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            announcementDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                            keysToDelete.announcementDislikeBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (announcementDislikeBatches.length > 0) {
                        for (let i = 0; i < announcementDislikeBatches.length; i++) {
                            if (announcementDislikeBatches[i].length > 0) {
                                // console.time("Announcement Dislike insertBulk operation time. order: " + i);
                                await AnnouncementLikeEntity.insertMany(announcementDislikeBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.announcementDislikeBatches[i]);
                                // console.timeEnd("Announcement Dislike insertBulk operation time. order: " + i);
                            }
                        }
                    }

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
                    const keysToDelete: {
                        announcementCommentBatches: string[][]
                    } = { announcementCommentBatches: [] };
                    const announcementCommentBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        announcementCommentBatches[iterator] = new Array<object>();
                        keysToDelete.announcementCommentBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            announcementCommentBatches[iterator].push(query.e);
                            keysToDelete.announcementCommentBatches[iterator].push(query.e._id);
                        }
                        iterator++;
                    }
                    if (announcementCommentBatches.length > 0) {
                        for (let i = 0; i < announcementCommentBatches.length; i++) {
                            if (announcementCommentBatches[i].length > 0) {
                                // console.time("Announcement Comment insertBulk operation time. order: " + i);
                                await AnnouncementCommentEntity.insertMany(announcementCommentBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.announcementCommentBatches[i]);
                                // console.timeEnd("Announcement Comment insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        announcementCommentLikeBatches: string[][]
                    } = { announcementCommentLikeBatches: [] };
                    const announcementCommentLikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        announcementCommentLikeBatches[iterator] = new Array<object>();
                        keysToDelete.announcementCommentLikeBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            announcementCommentLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                            keysToDelete.announcementCommentLikeBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (announcementCommentLikeBatches.length > 0) {
                        for (let i = 0; i < announcementCommentLikeBatches.length; i++) {
                            if (announcementCommentLikeBatches[i].length > 0) {
                                // console.time("Announcement Comment Like insertBulk operation time. order: " + i);
                                await AnnouncementCommentLikeEntity.insertMany(announcementCommentLikeBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.announcementCommentLikeBatches[i]);
                                // console.timeEnd("Announcement Comment Like insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        announcementCommentDislikeBatches: string[][]
                    } = { announcementCommentDislikeBatches: [] };
                    const announcementCommentDislikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        announcementCommentDislikeBatches[iterator] = new Array<object>();
                        keysToDelete.announcementCommentDislikeBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            announcementCommentDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                            keysToDelete.announcementCommentDislikeBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (announcementCommentDislikeBatches.length > 0) {
                        for (let i = 0; i < announcementCommentDislikeBatches.length; i++) {
                            if (announcementCommentDislikeBatches[i].length > 0) {
                                // console.time("Announcement Comment Dislike insertBulk operation time. order: " + i);
                                await AnnouncementCommentLikeEntity.insertMany(announcementCommentDislikeBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.announcementCommentDislikeBatches[i]);
                                // console.timeEnd("Announcement Comment Dislike insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        questionLikeBatches: string[][]
                    } = { questionLikeBatches: [] };
                    const questionLikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionLikeBatches[iterator] = new Array<object>();
                        keysToDelete.questionLikeBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                            keysToDelete.questionLikeBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionLikeBatches.length > 0) {
                        for (let i = 0; i < questionLikeBatches.length; i++) {
                            if (questionLikeBatches[i].length > 0) {
                                // console.time("Question Like insertBulk operation time. order: " + i);
                                await QuestionLikeEntity.insertMany(questionLikeBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.questionLikeBatches[i]);
                                // console.timeEnd("Question Like insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        questionDislikeBatches: string[][]
                    } = { questionDislikeBatches: [] };
                    const questionDislikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionDislikeBatches[iterator] = new Array<object>();
                        keysToDelete.questionDislikeBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                            keysToDelete.questionDislikeBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionDislikeBatches.length > 0) {
                        for (let i = 0; i < questionDislikeBatches.length; i++) {
                            if (questionDislikeBatches[i].length > 0) {
                                // console.time("Question Dislike insertBulk operation time. order: " + i);
                                await QuestionLikeEntity.insertMany(questionDislikeBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.questionDislikeBatches[i]);
                                // console.timeEnd("Question Dislike insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        questionCommentBatches: string[][]
                    } = { questionCommentBatches: [] };
                    const questionCommentBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionCommentBatches[iterator] = new Array<object>();
                        keysToDelete.questionCommentBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionCommentBatches[iterator].push(query.e);
                            keysToDelete.questionCommentBatches[iterator].push(query.e._id);
                        }
                        iterator++;
                    }
                    if (questionCommentBatches.length > 0) {
                        for (let i = 0; i < questionCommentBatches.length; i++) {
                            if (questionCommentBatches[i].length > 0) {
                                // console.time("Question Comment insertBulk operation time. order: " + i);
                                await QuestionCommentEntity.insertMany(questionCommentBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.questionCommentBatches[i]);
                                // console.timeEnd("Question Comment insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        questionCommentLikeBatches: string[][]
                    } = { questionCommentLikeBatches: [] };
                    const questionCommentLikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionCommentLikeBatches[iterator] = new Array<object>();
                        keysToDelete.questionCommentLikeBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionCommentLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                            keysToDelete.questionCommentLikeBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionCommentLikeBatches.length > 0) {
                        for (let i = 0; i < questionCommentLikeBatches.length; i++) {
                            if (questionCommentLikeBatches[i].length > 0) {
                                // console.time("Question Comment Like insertBulk operation time. order: " + i);
                                await QuestionCommentLikeEntity.insertMany(questionCommentLikeBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.questionCommentLikeBatches[i]);
                                // console.timeEnd("Question Comment Like insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        questionCommentDislikeBatches: string[][]
                    } = { questionCommentDislikeBatches: [] };
                    const questionCommentDislikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionCommentDislikeBatches[iterator] = new Array<object>();
                        keysToDelete.questionCommentDislikeBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionCommentDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                            keysToDelete.questionCommentDislikeBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionCommentDislikeBatches.length > 0) {
                        for (let i = 0; i < questionCommentDislikeBatches.length; i++) {
                            if (questionCommentDislikeBatches[i].length > 0) {
                                // console.time("Question Comment Dislike insertBulk operation time. order: " + i);
                                await QuestionCommentLikeEntity.insertMany(questionCommentDislikeBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.questionCommentDislikeBatches[i]);
                                // console.timeEnd("Question Comment Dislike insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        questionSubCommentBatches: string[][]
                    } = { questionSubCommentBatches: [] };
                    const questionSubCommentBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionSubCommentBatches[iterator] = new Array<object>();
                        keysToDelete.questionSubCommentBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionSubCommentBatches[iterator].push(query.e);
                            keysToDelete.questionSubCommentBatches[iterator].push(query.e._id);
                        }
                        iterator++;
                    }
                    if (questionSubCommentBatches.length > 0) {
                        for (let i = 0; i < questionSubCommentBatches.length; i++) {
                            if (questionSubCommentBatches[i].length > 0) {
                                // console.time("Question SubComment insertBulk operation time. order: " + i);
                                await QuestionSubCommentEntity.insertMany(questionSubCommentBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.questionSubCommentBatches[i]);
                                // console.timeEnd("Question SubComment insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        questionSubCommentLikeBatches: string[][]
                    } = { questionSubCommentLikeBatches: [] };
                    const questionSubCommentLikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionSubCommentLikeBatches[iterator] = new Array<object>();
                        keysToDelete.questionSubCommentLikeBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionSubCommentLikeBatches[iterator].push({ ...query.e, type: LikeType.Like });
                            keysToDelete.questionSubCommentLikeBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionSubCommentLikeBatches.length > 0) {
                        for (let i = 0; i < questionSubCommentLikeBatches.length; i++) {
                            if (questionSubCommentLikeBatches[i].length > 0) {
                                // console.time("Question SubComment Like insertBulk operation time. order: " + i);
                                await QuestionSubCommentLikeEntity.insertMany(questionSubCommentLikeBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.questionSubCommentLikeBatches[i]);
                                // console.timeEnd("Question SubComment Like insertBulk operation time. order: " + i);
                            }
                        }
                    }
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
                    const keysToDelete: {
                        questionSubCommentDislikeBatches: string[][]
                    } = { questionSubCommentDislikeBatches: [] };
                    const questionSubCommentDislikeBatches: Array<Array<object>> = [];
                    const batchSize = config.BATCH_SIZES.ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE;
                    let iterator = 0;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const currentBatch = data.slice(i, i + batchSize);
                        questionSubCommentDislikeBatches[iterator] = new Array<object>();
                        keysToDelete.questionSubCommentDislikeBatches[iterator] = new Array<string>();
                        for (let j = 0; j < currentBatch.length; j++) {
                            const query: any = currentBatch[j].toJSONObject();
                            questionSubCommentDislikeBatches[iterator].push({ ...query.e, type: LikeType.Dislike });
                            keysToDelete.questionSubCommentDislikeBatches[iterator].push(query.e.ownerId);
                        }
                        iterator++;
                    }
                    if (questionSubCommentDislikeBatches.length > 0) {
                        for (let i = 0; i < questionSubCommentDislikeBatches.length; i++) {
                            if (questionSubCommentDislikeBatches[i].length > 0) {
                                // console.time("Question SubComment Dislike insertBulk operation time. order: " + i);
                                await QuestionCommentLikeEntity.insertMany(questionSubCommentDislikeBatches[i]);
                                await RedisService.client.hDel(currentKey, keysToDelete.questionSubCommentDislikeBatches[i]);
                                // console.timeEnd("Question SubComment Dislike insertBulk operation time. order: " + i);
                            }
                        }
                    }
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