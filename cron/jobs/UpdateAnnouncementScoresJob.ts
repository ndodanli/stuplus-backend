import AsyncLock from "async-lock";
import { AnnouncementEntity, AnnouncementLikeEntity } from "../../stuplus-lib/entities/BaseEntity";
import { LikeType } from "../../stuplus-lib/enums/enums";
import RedisService from "../../stuplus-lib/services/redisService";
import IBaseCronJob from "./IBaseCronJob";

export default class UpdateAnnouncementScoresJob implements IBaseCronJob {
    cronExpression: string;
    customLock?: AsyncLock | undefined;
    title: string;
    description: string;
    /**
     *
     */
    constructor({ cronExpression, customLock, title, description }: { cronExpression: string, customLock?: AsyncLock | undefined, title: string, description: string }) {
        this.cronExpression = cronExpression;
        this.customLock = customLock;
        this.title = title;
        this.description = description;
    }
    async run(): Promise<void> {
        console.log("UpdateAnnouncementScoresJob Cron job started");
        let now = new Date();
        let activeAnnouncementIds = await RedisService.acquire<Array<string>>(`activeAnnouncements:ids`, 30, async () => await AnnouncementEntity.find({
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
        }, { _id: 1, }, { lean: true }).then(x => x.map(y => y._id.toString())));
        if (activeAnnouncementIds.length) {

            const bulkAnnoLikeCountUpdateOps = [];

            for (let i = 0; i < activeAnnouncementIds.length; i++) {
                const announcementId = activeAnnouncementIds[i];
                const score = await AnnouncementLikeEntity.countDocuments({ announcementId: announcementId });
                bulkAnnoLikeCountUpdateOps.push({
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

            await AnnouncementEntity.bulkWrite(bulkAnnoLikeCountUpdateOps);
        }
        console.log("UpdateAnnouncementScoresJob Cron job finished");
    }
}