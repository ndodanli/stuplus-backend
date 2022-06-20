import { AnnouncementCommentEntity, AnnouncementEntity, AnnouncementLikeEntity, SchoolEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { AnnouncementDocument } from "../../stuplus-lib/entities/AnnouncementEntity";
import { AddAnnouncementDTO, GetAnnouncementsForUserDTO } from "../dtos/AnnouncementDTOs";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import RedisService from "../../stuplus-lib/services/redisService";
import { SchoolDocument } from "../../stuplus-lib/entities/SchoolEntity";

export class AnnouncementAccess {
    public static async addAnnouncement(acceptedLanguages: Array<string>, payload: AddAnnouncementDTO, currentUserId: string): Promise<Boolean> {
        const user = await UserEntity.findOne({ _id: currentUserId }, {}, { lean: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        if (typeof payload.relatedSchoolIds === "string")
            payload.relatedSchoolIds = payload.relatedSchoolIds.split(",");

        if (!payload.relatedSchoolIds?.every(x => user.relatedSchoolIds.includes(x)))
            throw new NotValidError(getMessage("userNotAuthorized", acceptedLanguages));

        await AnnouncementEntity.create(new AnnouncementEntity({
            ...payload,
            ownerId: user._id.toString(),
        }));

        return true;
    }

    public static async getAnnouncementsForUser(acceptedLanguages: Array<string>, payload: GetAnnouncementsForUserDTO, currentUserId: string): Promise<AnnouncementDocument[] | null> {

        let now = new Date();
        let announcements: AnnouncementDocument[] = [];
        if (payload.schoolIds && payload.schoolIds.length) {
            announcements = await AnnouncementEntity.find({
                relatedSchoolIds: { $in: payload.schoolIds },
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
            }, {}, { lean: true, sort: { createdAt: -1 }, skip: payload.skip, limit: payload.take });
        } else {
            var user = await UserEntity.findOne({ _id: currentUserId }, {}, { lean: true });
            if (user?.schoolId) {
                announcements = await AnnouncementEntity.find({
                    relatedSchoolIds: { $in: [user.schoolId] },
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
                }, {}, { lean: true, sort: { createdAt: -1 }, skip: payload.skip, limit: payload.take });
            }
            else {
                announcements = await AnnouncementEntity.find({
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
                }, {}, { lean: true, sort: { createdAt: -1 }, skip: payload.skip, limit: payload.take });
            }
        };

        if (announcements.length) {
            let announcementUserIds = announcements.map(x => x.ownerId);
            let announcementUsers = await UserEntity.customFind({ _id: { $in: announcementUserIds } }, { "_id": 1, "username": 1 }, { lean: true });
            let a = new AnnouncementEntity({
                likeCount: 22
            })
            //TODO: cache schools. *redis acquired
            let schools = await RedisService.acquire<SchoolDocument[]>("schools", 5, async () => await SchoolEntity.find({}, ["_id", "title"], { lean: true }));
            for (let i = 0; i < announcements.length; i++) {
                const announcement = announcements[i];
                announcement.likeCount = await RedisService.acquire<number>(`announcement:${announcement._id}:likeCount`, 10, async () => await AnnouncementLikeEntity.countDocuments({ announcementId: announcement._id }));
                announcement.commentCount = await RedisService.acquire<number>(`announcement:${announcement._id}:commentCount`, 10, async () => await AnnouncementCommentEntity.countDocuments({ announcementId: announcement._id }));
                announcement.owner = announcementUsers.find(y => y._id.toString() === announcement.ownerId);
                announcement.relatedSchools = schools.filter(y => announcement.relatedSchoolIds.includes(y._id.toString()))
                    .map(x => {
                        return {
                            title: x.title,
                            schoolId: x._id.toString()
                        }
                    });
            }
        }
        return announcements;
    }
}