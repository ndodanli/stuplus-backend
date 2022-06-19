import { AnnouncementEntity, SchoolEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { AnnouncementDocument } from "../../stuplus-lib/entities/AnnouncementEntity";
import { AddAnnouncementDTO, GetAnnouncementsForUserDTO } from "../dtos/AnnouncementDTOs";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";

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
            let announcementUsers = await UserEntity.find({ _id: { $in: announcementUserIds } }, { "_id": 1, "username": 1 }, { lean: true });

            announcements.forEach(x => {
                x.owner = announcementUsers.find(y => y._id.toString() === x.ownerId);
            });

            // let announcementReqSchoolIds = [...new Set(Array.prototype.concat.apply([], announcements.map(x => x.relatedSchoolIds)))];
            let schools = await SchoolEntity.find({}, ["_id", "title"], { lean: true });
            announcements.forEach(x => {
                x.relatedSchools = schools.filter(y => x.relatedSchoolIds.includes(y._id.toString()))
                    .map(x => {
                        return {
                            title: x.title,
                            schoolId: x._id.toString()
                        }
                    });
            });
        }

        return announcements;
    }
}