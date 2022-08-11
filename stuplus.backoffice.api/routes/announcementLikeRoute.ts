import { Router } from "express"
import { AnnouncementEntity, AnnouncementLikeEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateAnnouncementLikeDTO, AnnouncementLikeListDTO } from "../dtos/announcementLike";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";
import RedisService from "../../stuplus-lib/services/redisService";

const router = Router();

router.get("/list", authorize([Role.Admin, Role.Moderator]), async (req: CustomRequest<AnnouncementLikeListDTO>, res: any) => {
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

    let temp = AnnouncementLikeEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { type: { $regex: search, $options: "i" } },
      ]);
    }
    let announcementLikes = await temp;
    const total = await AnnouncementLikeEntity.countDocuments();
    const ownerIds = announcementLikes.map(announcementLike => announcementLike.ownerId);
    const owners = await UserEntity.find({ _id: { $in: ownerIds } }, ["_id", "username"], { lean: true });
    const announcementIds = announcementLikes.map(announcementLike => announcementLike.announcementId);
    const announcements = await AnnouncementEntity.find({ _id: { $in: announcementIds } }, ["_id", "title"], { lean: true });
    response.data = { items: announcementLikes, owners: owners, announcements: announcements, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/addUpdateAnnouncementLike", authorize([Role.Admin, Role.Moderator]), async (req: CustomRequest<AddUpdateAnnouncementLikeDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const announcementLike = new AddUpdateAnnouncementLikeDTO(req.body);
    if (announcementLike._id) {
      const announcementLikeToUpdate = await AnnouncementLikeEntity.findOne({ _id: announcementLike._id });
      if (!announcementLikeToUpdate) {
        response.setErrorMessage("AnnouncementLike not found");
        throw new NotValidError("AnnouncementLike not found", 404);
      }
      announcementLikeToUpdate.ownerId = announcementLike.ownerId;
      announcementLikeToUpdate.announcementId = announcementLike.announcementId;
      announcementLikeToUpdate.type = announcementLike.type;

      await announcementLikeToUpdate.save();
    }
    else {
      if (await AnnouncementLikeEntity.findOne({ ownerId: announcementLike.ownerId, announcementId: announcementLike.announcementId }))
        throw new NotValidError("This user already liked/dislike this announcement");
      const newAnnouncementLike = new AnnouncementLikeEntity(announcementLike);
      await newAnnouncementLike.save();
    }
  } catch (err: any) {
    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.delete("/deleteAnnouncementLike", authorize([Role.Admin, Role.Moderator]), async (req: CustomRequest<AnnouncementLikeListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const announcementLike = await AnnouncementLikeEntity.findOne({ _id: req.body._id });
    if (!announcementLike) {
      throw new NotValidError("AnnouncementLike not found", 404);
    }
    announcementLike.recordStatus = RecordStatus.Deleted;

    await announcementLike.save();
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

export default router;
