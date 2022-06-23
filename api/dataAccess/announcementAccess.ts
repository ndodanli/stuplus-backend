import { AnnouncementCommentEntity, AnnouncementCommentLikeEntity, AnnouncementEntity, AnnouncementLikeEntity, SchoolEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { AnnouncementDocument } from "../../stuplus-lib/entities/AnnouncementEntity";
import { AddAnnouncementDTO, AnnouncementCommenLikeDisliketDTO, AnnouncementCommentDTO, AnnouncementLikeDislikeDTO, GetAnnouncementsForUserDTO } from "../dtos/AnnouncementDTOs";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import RedisService from "../../stuplus-lib/services/redisService";
import { SchoolDocument } from "../../stuplus-lib/entities/SchoolEntity";
import { RedisOperationType } from "../../stuplus-lib/enums/enums_socket";

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
            let announcementUserIds = [...new Set(announcements.map(x => x.ownerId))];
            let announcementUsers = await UserEntity.find({ _id: { $in: announcementUserIds } }, { "_id": 1, "username": 1 }, { lean: true });
            let schools = await RedisService.acquire<SchoolDocument[]>("schools", 60 * 60 * 2, async () => await SchoolEntity.find({}, ["_id", "title"], { lean: true }));
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

    public static async likeDislikeAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementLikeDislikeDTO, currentUserId: string): Promise<Boolean> {
        const announcementLikeDislikeEntity = new AnnouncementLikeEntity({});
        const announcementLikeDislikeData: object = {
            e: {
                _id: announcementLikeDislikeEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
                type: payload.type
            },
        }
        await RedisService.client.rPush(RedisOperationType.AnnouncementLikeDislike + payload.announcementId, announcementLikeDislikeData.toString());
        return true;
    }

    public static async commentAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementCommentDTO, currentUserId: string): Promise<Boolean> {
        const announcementCommentEntity = new AnnouncementCommentEntity({});
        const announcementCommentData: object = {
            e: {
                _id: announcementCommentEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
                comment: payload.comment
            },
        }
        await RedisService.client.rPush(RedisOperationType.AnnouncementLikeDislike + payload.announcementId, announcementCommentData.toString());

        return true;
    }

    public static async commentLikeDislikeAnnouncement(acceptedLanguages: Array<string>, payload: AnnouncementCommenLikeDisliketDTO, currentUserId: string): Promise<Boolean> {
        const announcementCommentEntity = new AnnouncementCommentLikeEntity({});
        const announcementCommentData: object = {
            e: {
                _id: announcementCommentEntity.id,
                ownerId: currentUserId,
                announcementId: payload.announcementId,
                commentId: payload.commentId,
                type: payload.type
            },
        }
        await RedisService.client.rPush(RedisOperationType.AnnouncementLikeDislike + payload.announcementId, announcementCommentData.toString());

        return true;
    }
}