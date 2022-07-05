import { Router } from "express"
import { AnnouncementEntity, AnnouncementCommentEntity, UserEntity, AnnouncementCommentLikeEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateAnnouncementCommentDTO, AnnouncementCommentListDTO } from "../dtos/announcementComment";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";

const router = Router();

router.get("/list", authorize([Role.Admin]), async (req: CustomRequest<AnnouncementCommentListDTO>, res: any) => {
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

    let temp = AnnouncementCommentEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { comment: { $regex: search, $options: "i" } },
      ]);
    }
    let announcementComments = await temp;
    const total = await AnnouncementCommentEntity.countDocuments();
    const ownerIds = announcementComments.map(AnnouncementComment => AnnouncementComment.ownerId);
    const owners = await UserEntity.find({ _id: { $in: ownerIds } }, ["_id", "username"], { lean: true });
    const announcementIds = announcementComments.map(AnnouncementComment => AnnouncementComment.announcementId);
    const announcements = await AnnouncementEntity.find({ _id: { $in: announcementIds } }, ["_id", "title"], { lean: true });
    response.data = { items: announcementComments, owners: owners, announcements: announcements, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.post("/addUpdateAnnouncementComment", authorize([Role.Admin]), async (req: CustomRequest<AddUpdateAnnouncementCommentDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const announcementComment = new AddUpdateAnnouncementCommentDTO(req.body);
    if (announcementComment._id) {
      const announcementCommentToUpdate = await AnnouncementCommentEntity.findById(announcementComment._id);
      if (!announcementCommentToUpdate) {
        response.setErrorMessage("AnnouncementComment not found");
        throw new NotValidError("AnnouncementComment not found", 404);
      }
      announcementCommentToUpdate.ownerId = announcementComment.ownerId;
      announcementCommentToUpdate.announcementId = announcementComment.announcementId;
      announcementCommentToUpdate.comment = announcementComment.comment;

      await announcementCommentToUpdate.save();
    }
    else {
      const newAnnouncementComment = new AnnouncementCommentEntity(announcementComment);
      await newAnnouncementComment.save();
    }
  } catch (err: any) {
    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.delete("/deleteAnnouncementComment", authorize([Role.Admin]), async (req: CustomRequest<AnnouncementCommentListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const announcementComment = await AnnouncementCommentEntity.findOne({ _id: req.body._id });
    if (!announcementComment) {
      throw new NotValidError("Announcement not found");
    }
    announcementComment.recordStatus = RecordStatus.Deleted;

    await AnnouncementCommentLikeEntity.updateMany(
      { commentId: announcementComment._id },
      { recordStatus: RecordStatus.Deleted }
    );
    await announcementComment.save();
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

export default router;
