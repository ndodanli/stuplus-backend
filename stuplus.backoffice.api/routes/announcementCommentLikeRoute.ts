import { Router } from "express"
import { AnnouncementCommentLikeEntity, UserEntity, AnnouncementCommentEntity, AnnouncementEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateAnnouncementCommentLikeDTO, AnnouncementCommentLikeListDTO } from "../dtos/announcementCommentLike";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";

const router = Router();

router.get("/list", authorize([Role.Admin, Role.Moderator]), async (req: CustomRequest<AnnouncementCommentLikeListDTO>, res: any) => {
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

    let temp = AnnouncementCommentLikeEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { comment: { $regex: search, $options: "i" } },
      ]);
    }
    let announcementCommentLikes = await temp;
    const total = await AnnouncementCommentLikeEntity.countDocuments();
    const ownerIds = announcementCommentLikes.map(announcementCommentLike => announcementCommentLike.ownerId);
    const owners = await UserEntity.find({ _id: { $in: ownerIds } }, ["_id", "username"], { lean: true });
    const commentIds = announcementCommentLikes.map(announcementCommentLike => announcementCommentLike.commentId);
    const comments = await AnnouncementCommentEntity.find({ _id: { $in: commentIds } }, ["_id", "comment"], { lean: true });
    const announcementIds = announcementCommentLikes.map(announcementCommentLike => announcementCommentLike.announcementId);
    const announcements = await AnnouncementEntity.find({ _id: { $in: announcementIds } }, ["_id", "title"], { lean: true });
    response.data = { items: announcementCommentLikes, owners: owners, announcements: announcements, comments: comments, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/addUpdateAnnouncementCommentLike", authorize([Role.Admin, Role.Moderator]), async (req: CustomRequest<AddUpdateAnnouncementCommentLikeDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const announcementCommentLike = new AddUpdateAnnouncementCommentLikeDTO(req.body);
    if (announcementCommentLike._id) {
      const announcementCommentLikeToUpdate = await AnnouncementCommentLikeEntity.findOne({ _id: announcementCommentLike._id });
      if (!announcementCommentLikeToUpdate) {
        response.setErrorMessage("AnnouncementCommentLike not found");
        throw new NotValidError("AnnouncementCommentLike not found", 404);
      }
      announcementCommentLikeToUpdate.ownerId = announcementCommentLike.ownerId;
      announcementCommentLikeToUpdate.commentId = announcementCommentLike.commentId;
      announcementCommentLikeToUpdate.type = announcementCommentLike.type;

      await announcementCommentLikeToUpdate.save();
    }
    else {
      if (await AnnouncementCommentLikeEntity.findOne({ ownerId: announcementCommentLike.ownerId, commentId: announcementCommentLike.commentId }))
        throw new NotValidError("This user already liked/dislike this announcement");
      const newAnnouncementCommentLike = new AnnouncementCommentLikeEntity(announcementCommentLike);
      await newAnnouncementCommentLike.save();
    }
  } catch (err: any) {
    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.delete("/deleteAnnouncementCommentLike", authorize([Role.Admin, Role.Moderator]), async (req: CustomRequest<AnnouncementCommentLikeListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const announcementCommentLike = await AnnouncementCommentLikeEntity.findOne({ _id: req.body._id });
    if (!announcementCommentLike) {
      throw new NotValidError("AnnouncementCommentLike not found", 404);
    }
    announcementCommentLike.recordStatus = RecordStatus.Deleted;

    await announcementCommentLike.save();
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

export default router;
