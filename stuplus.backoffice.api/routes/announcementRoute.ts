import { Router } from "express"
import { AnnouncementEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateAnnouncementDTO, AnnouncementListDTO } from "../dtos/announcement";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";
import { searchableWithSpaces } from "../../stuplus-lib/utils/general";

const router = Router();

router.get("/list", authorize([Role.Admin, Role.Moderator]), async (req: CustomRequest<AnnouncementListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    let limit = parseInt(req.query.pageSize as string);
    let skip = (parseInt(req.query.page as string) - 1) * limit;
    let sort = req.query.sort as string;
    let sortOrder: SortOrder = sort.slice(0, 1) === "+" ? 1 : -1;
    let sortBy = sort.slice(1);
    let sortFilter = {
      [sortBy]: sortOrder
    }
    let search = req.query.search as string;
    if (search) {
      search = search.toLowerCase();
    }

    let temp = AnnouncementEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { username: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ]);
    }
    let announcements = await temp;
    const total = await AnnouncementEntity.countDocuments();
    const ownerIds = announcements.map(announcement => announcement.ownerId);
    const owners = await UserEntity.find({ _id: { $in: ownerIds } }, ["_id", "username"], { lean: true });
    response.data = { items: announcements, owners: owners, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/addUpdateAnnouncement", authorize([Role.Admin, Role.Moderator]), async (req: CustomRequest<AddUpdateAnnouncementDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const Announcement = new AddUpdateAnnouncementDTO(req.body);
    if (Announcement._id) {
      const announcementToUpdate = await AnnouncementEntity.findOne({ _id: Announcement._id });
      if (!announcementToUpdate) {
        response.setErrorMessage("Announcement not found");
        throw new NotValidError("Announcement not found", 404);
      }
      announcementToUpdate.ownerId = Announcement.ownerId;
      announcementToUpdate.title = Announcement.title;
      announcementToUpdate.titlesch = searchableWithSpaces(Announcement.title);
      announcementToUpdate.coverImageUrl = Announcement.coverImageUrl;
      announcementToUpdate.relatedSchoolIds = Announcement.relatedSchoolIds;
      announcementToUpdate.text = Announcement.text;
      announcementToUpdate.isActive = Announcement.isActive;
      announcementToUpdate.fromDate = Announcement.fromDate;
      announcementToUpdate.toDate = Announcement.toDate;
      await announcementToUpdate.save();
    }
    else {
      const newAnnouncement = new AnnouncementEntity(Announcement);
      newAnnouncement.titlesch = searchableWithSpaces(Announcement.title);
      await newAnnouncement.save();
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.delete("/deleteAnnouncement", authorize([Role.Admin, Role.Moderator]), async (req: CustomRequest<AnnouncementListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const announcement = await AnnouncementEntity.findOne({ _id: req.body._id });
    if (!announcement) {
      throw new NotValidError("Announcement not found", 404);
    }
    announcement.recordStatus = RecordStatus.Deleted;

    await announcement.save();
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

export default router;
