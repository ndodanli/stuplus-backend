import AsyncLock from "async-lock";
import { AnnouncementCommentEntity, AnnouncementCommentLikeEntity, AnnouncementEntity, AnnouncementLikeEntity, QuestionCommentEntity, QuestionCommentLikeEntity, QuestionEntity, QuestionLikeEntity } from "../../stuplus-lib/entities/BaseEntity";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import RedisService from "../../stuplus-lib/services/redisService";
import { flatten } from "../../stuplus-lib/utils/general";
import IBaseCronJob from "./IBaseCronJob";

export default class UpdateScoresJob implements IBaseCronJob {
    cronExpression: string;
    customLock?: AsyncLock | undefined;
    customLockKey?: string;
    title: string;
    description: string;
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
        // console.log("UpdateAnnouncementScoresJob Cron job started");
        let now = new Date();
        let activeAnnouncementIds = await AnnouncementEntity.find({
            isActive: true,
            $and: [
                {
                    $or: [
                        { fromDate: null },
                        { fromDate: { $gte: now } },
                    ]
                },
                {
                    $or: [
                        { toDate: null },
                        { toDate: { $lte: now } },
                    ],
                }
            ]
        }, { _id: 1, }, { lean: true }).then(x => x.map(y => y._id.toString()));

        if (activeAnnouncementIds.length) {
            const bulkAnnouncementScoreUpdateOps = [];

            for (let i = 0; i < activeAnnouncementIds.length; i++) {
                const announcementId = activeAnnouncementIds[i];
                let score = 0;
                score += await RedisService.client.hLen(RedisKeyType.DBAnnouncementLike + announcementId);
                score += await RedisService.client.hLen(RedisKeyType.DBAnnouncementDislike + announcementId);
                score += await AnnouncementLikeEntity.countDocuments({ announcementId: announcementId });
                bulkAnnouncementScoreUpdateOps.push({
                    updateOne: {
                        filter: {
                            _id: announcementId
                        },
                        update: {
                            score: score
                        }
                    }
                })
            }

            await AnnouncementEntity.bulkWrite(bulkAnnouncementScoreUpdateOps);

            const announcementCommentIds = await AnnouncementCommentEntity.find({
                announcementId: { $in: activeAnnouncementIds }
            }, { _id: 1, }, { lean: true }).then(x => x.map(y => y._id.toString()));
            if (announcementCommentIds.length) {
                const bulkCommentScoreUpdateOps = [];

                for (let i = 0; i < announcementCommentIds.length; i++) {
                    const commentId = announcementCommentIds[i];
                    let score = 0;
                    score += await RedisService.client.hLen(RedisKeyType.DBAnnouncementCommentLike + commentId);
                    score += await RedisService.client.hLen(RedisKeyType.DBAnnouncementCommentDislike + commentId);
                    score += await AnnouncementCommentLikeEntity.countDocuments({ commentId: commentId });
                    bulkCommentScoreUpdateOps.push({
                        updateOne: {
                            filter: {
                                _id: commentId
                            },
                            update: {
                                score: score
                            }
                        }
                    })
                }

                await AnnouncementCommentEntity.bulkWrite(bulkCommentScoreUpdateOps);
            }
        }
        let activeQuestionIds = await QuestionEntity.find({
            isActive: true,
            $and: [
                {
                    $or: [
                        { fromDate: null },
                        { fromDate: { $gte: now } },
                    ]
                },
                {
                    $or: [
                        { toDate: null },
                        { toDate: { $lte: now } },
                    ],
                }
            ]
        }, { _id: 1, }, { lean: true }).then(x => x.map(y => y._id.toString()));

        if (activeQuestionIds.length) {
            const bulkQuestionScoreUpdateOps = [];

            for (let i = 0; i < activeQuestionIds.length; i++) {
                const questionId = activeQuestionIds[i];
                let qScore = 0;
                qScore += await RedisService.client.hLen(RedisKeyType.DBQuestionLike + questionId);
                qScore += await RedisService.client.hLen(RedisKeyType.DBQuestionDislike + questionId);
                qScore += await QuestionLikeEntity.countDocuments({ questionId: questionId });
                bulkQuestionScoreUpdateOps.push({
                    updateOne: {
                        filter: {
                            _id: questionId
                        },
                        update: {
                            score: qScore
                        }
                    }
                })
            }

            await QuestionEntity.bulkWrite(bulkQuestionScoreUpdateOps);

            const questionCommentIds = await QuestionCommentEntity.find({
                questionId: { $in: activeQuestionIds }
            }, { _id: 1, }, { lean: true }).then(x => x.map(y => y._id.toString()));
            if (questionCommentIds.length) {
                const bulkQCommentScoreUpdateOps = [];

                for (let i = 0; i < questionCommentIds.length; i++) {
                    const qCommentId = questionCommentIds[i];
                    let qCScore = 0;
                    qCScore += await RedisService.client.hLen(RedisKeyType.DBQuestionCommentLike + qCommentId);
                    qCScore += await RedisService.client.hLen(RedisKeyType.DBQuestionCommentDislike + qCommentId);
                    qCScore += await QuestionCommentLikeEntity.countDocuments({ commentId: qCommentId });
                    bulkQCommentScoreUpdateOps.push({
                        updateOne: {
                            filter: {
                                _id: qCommentId
                            },
                            update: {
                                score: qCScore
                            }
                        }
                    })
                }

                await QuestionCommentEntity.bulkWrite(bulkQCommentScoreUpdateOps);
            }
        }


        // console.log("UpdateAnnouncementScoresJob Cron job finished");
    }
}