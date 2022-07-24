import AsyncLock from "async-lock";
import { RedisFileMessageUpdateDTO, RedisMessageReceiptUpdateDTO } from "../../stuplus.api/socket/dtos/RedisChat";
import { config } from "../../stuplus-lib/config/config";
import { AnnouncementCommentEntity, AnnouncementCommentLikeEntity, AnnouncementLikeEntity, DailyUserStatisticEntity, GroupMessageEntity, GroupMessageForwardEntity, GroupMessageReadEntity, HashtagEntity, MessageEntity, QuestionCommentEntity, QuestionCommentLikeEntity, QuestionLikeEntity, SearchHistoryEntity } from "../../stuplus-lib/entities/BaseEntity";
import { LikeType } from "../../stuplus-lib/enums/enums";
import { RedisGMOperationType, RedisKeyType, RedisPMOperationType } from "../../stuplus-lib/enums/enums_socket";
import RedisService from "../../stuplus-lib/services/redisService";
import IBaseCronJob from "./IBaseCronJob";
import { chunk, stringify } from "../../stuplus-lib/utils/general";
import logger from "../../stuplus-lib/config/logger";

export default class UserLimitsJob implements IBaseCronJob {
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
        console.log("UserLimitsJob Cron job started");
        try {
            do {
                const { keys, cursor } = await RedisService.client.scan(UserLimitsJob.currentCursor, { MATCH: "l*", COUNT: 100 });
                UserLimitsJob.currentCursor = cursor;
                const userLimits: Map<string, any> = new Map();

                for (let i = 0; i < keys.length; i++) {
                    const currentKey = keys[i];
                    const splittedKey = currentKey.split(":");
                    const countKey = splittedKey[1]
                    const userId = splittedKey[2];
                    const limit = userLimits.get(userId);
                    if (!limit) {
                        userLimits.set(userId, {
                            ownerId: userId,
                            [countKey]: await RedisService.client.get(currentKey).then(x => parseInt(x ?? "0"))
                        });
                    } else {
                        userLimits.set(userId, {
                            ...limit,
                            [countKey]: await RedisService.client.get(currentKey).then(x => parseInt(x ?? "0"))
                        });
                    }
                }
                await DailyUserStatisticEntity.insertMany(Array.from(userLimits.values()));
                await RedisService.client.del(keys);

            } while (UserLimitsJob.currentCursor != 0);

            console.log("UserLimitsJob Cron job finished");
        } catch (error) {
            console.log("UserLimitsJob Cron job error", error);
        }
    }
}