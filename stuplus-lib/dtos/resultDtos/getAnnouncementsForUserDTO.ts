import { Announcement } from "../../entities/AnnouncementEntity";
import { User } from "../../entities/UserEntity";

export class GetAnnouncementsForUserResultDTO {
    announcemenets!: Announcement[];
    owner!: User; // ignore
    relatedSchools!: object[]; // ignore
    likeCount!: object[]; // ignore
    comments!: object[]; // ignore
}