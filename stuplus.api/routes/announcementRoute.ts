import { Router } from "express"
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { validateAddAnnouncement, validateCommentAnnouncement, validateCommentLikeDislikeAnnouncement, validateGetAnnouncementsAnnouncement, validateGetCommentsAnnouncement, validateGetSubCommentsAnnouncement, validateLikeDislikeAnnouncement, validateSubCommentAnnouncement, validateSubCommentLikeDislikeAnnouncement } from "../middlewares/validation/announcement/validateAnnouncementRoute";
import { authorize } from "../middlewares/auth";
import { OSNotificationType, Role } from "../../stuplus-lib/enums/enums";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { AnnouncementAddDTO, AnnouncementCommenLikeDisliketDTO, AnnouncementCommentDTO, AnnouncementLikeDislikeDTO, AnnouncementGetMultipleDTO, AnnouncementGetCommentsDTO, AnnouncementSubCommentDTO, AnnouncementSubCommenLikeDisliketDTO, AnnouncementGetSubCommentsDTO } from "../dtos/AnnouncementDTOs";
import { AnnouncementAccess } from "../dataAccess/announcementAccess";
import axios from "axios";
import { AnnouncementCommentEntity, AnnouncementEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import OneSignalService from "../../stuplus-lib/services/oneSignalService";
import { truncate } from "../../stuplus-lib/utils/general";
const router = Router();

router.post("/add", authorize([Role.ContentCreator, Role.Admin]), validateAddAnnouncement, async (req: CustomRequest<AnnouncementAddDTO>, res: any) => {
  /* #swagger.tags = ['Announcement']
     #swagger.description = 'Add an announcement.' */
  /*	#swagger.requestBody = {
     required: true,
     schema: { $ref: "#/definitions/AnnouncementAddRequest" }
     } */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    const payload = new AnnouncementAddDTO(req.body);
    if (payload.images) {
      for (let i = 0; i < payload.images.length; i++) {
        const image = payload.images[i];
        const { headers } = await axios.head(image.url ?? "");
        if (!new URL(image.url ?? "").hostname.includes("stuplus-bucket.s3") || headers["accept-ranges"] != "bytes" || parseInt(headers["content-length"]) > 10485760)
          throw new NotValidError("Yüklenen görseller değişmiş, bir şeyler yapmaya çalışıyorsanız bırakın, çalışmıyorsanız bizimle iletişime geçin, teşekkürler")
      }
    }
    response.data = await AnnouncementAccess.addAnnouncement(req.selectedLangs(), payload, res.locals.user._id);

    response.setMessage(getMessage("announcementAdded", req.selectedLangs()));

  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/getAnnouncements", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateGetAnnouncementsAnnouncement, async (req: CustomRequest<AnnouncementGetMultipleDTO>, res: any) => {
  /* #swagger.tags = ['Announcement']
      #swagger.description = 'Get announcements.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AnnouncementGetAnnouncementsRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AnnouncementGetAnnouncementsResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await AnnouncementAccess.getAnnouncements(req.selectedLangs(), new AnnouncementGetMultipleDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.get("/getAnnouncement/:id", authorize([Role.ContentCreator, Role.User, Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  /* #swagger.tags = ['Announcement']
      #swagger.description = 'Get announcement by id.' */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AnnouncementGetAnnouncementResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await AnnouncementAccess.getAnnouncement(req.selectedLangs(), req.params.id, res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/likeDislike", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateLikeDislikeAnnouncement, async (req: CustomRequest<AnnouncementLikeDislikeDTO>, res: any) => {
  /* #swagger.tags = ['Announcement']
  #swagger.description = 'Like or dislike an announcement.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AnnouncementLikeDislikeRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await AnnouncementAccess.likeDislikeAnnouncement(req.selectedLangs(), new AnnouncementLikeDislikeDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/getComments", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateGetCommentsAnnouncement, async (req: CustomRequest<AnnouncementGetCommentsDTO>, res: any) => {
  /* #swagger.tags = ['Announcement']
      #swagger.description = 'Get comments of an announcement.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AnnouncementGetCommentsRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AnnouncementGetCommentsResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await AnnouncementAccess.getComments(req.selectedLangs(), new AnnouncementGetCommentsDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/comment", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateCommentAnnouncement, async (req: CustomRequest<AnnouncementCommentDTO>, res: any) => {
  /* #swagger.tags = ['Announcement']
#swagger.description = 'Comment to an announcement.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AnnouncementCommentRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<any>();
  try {
    response.data = await AnnouncementAccess.commentAnnouncement(req.selectedLangs(), new AnnouncementCommentDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  Ok(res, response)

  const announcement = await AnnouncementEntity.findOne({ _id: req.body.announcementId }, { _id: 0, ownerId: 1, title: 1 });
  if (announcement) {
    await OneSignalService.sendNotificationWithUserIds({
      userIds: [announcement.ownerId],
      heading: `${truncate(announcement.title, 20)} yeni bir yorum aldı.`,
      content: `${truncate(req.body.comment, 50)}`,
      chatId: req.body.announcementId,
      data: {
        type: OSNotificationType.AnnouncementNewComment,
        announcementId: req.body.announcementId,
        commentId: response.data?._id
      }
    })
  }
});

router.post("/commentLikeDislike", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateCommentLikeDislikeAnnouncement, async (req: CustomRequest<AnnouncementCommenLikeDisliketDTO>, res: any) => {
  /* #swagger.tags = ['Announcement']
#swagger.description = 'Like or dislike a anouncement's comment.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AnnouncementCommentLikeDislikeRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await AnnouncementAccess.commentLikeDislikeAnnouncement(req.selectedLangs(), new AnnouncementCommenLikeDisliketDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/getSubComments", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateGetSubCommentsAnnouncement, async (req: CustomRequest<AnnouncementGetSubCommentsDTO>, res: any) => {
  /* #swagger.tags = ['Announcement']
      #swagger.description = 'Get sub comments of a comment.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AnnouncementGetSubCommentsRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AnnouncementGetSubCommentsResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await AnnouncementAccess.getSubComments(req.selectedLangs(), new AnnouncementGetSubCommentsDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/subComment", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSubCommentAnnouncement, async (req: CustomRequest<AnnouncementSubCommentDTO>, res: any) => {
  /* #swagger.tags = ['Announcement']
#swagger.description = 'Comment to a comment.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AnnouncementSubCommentRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<any>();
  try {
    response.data = await AnnouncementAccess.subCommentAnnouncement(req.selectedLangs(), new AnnouncementSubCommentDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  Ok(res, response)

  const announcement = await AnnouncementEntity.findOne({ _id: req.body.announcementId }, { _id: 0, ownerId: 1, title: 1 });
  if (announcement) {
    await OneSignalService.sendNotificationWithUserIds({
      userIds: [announcement.ownerId],
      heading: `${truncate(announcement.title, 20)} yeni bir yorum aldı.`,
      content: `${truncate(req.body.comment, 50)}`,
      chatId: req.body.announcementId,
      data: {
        type: OSNotificationType.AnnouncementNewSubComment,
        announcementId: req.body.announcementId,
        subCommentId: response.data?._id
      }
    })
  }
  const comment = await AnnouncementCommentEntity.findOne({ _id: req.body.commentId }, { _id: 0, ownerId: 1 });
  if (comment) {
    const subCommentOwner = await UserEntity.findOne({ _id: res.locals.user._id }, { _id: 0, username: 1 });
    if (subCommentOwner) {
      await OneSignalService.sendNotificationWithUserIds({
        userIds: [comment.ownerId],
        heading: `${truncate(subCommentOwner.username, 20)} yorumuna cevap verdi.`,
        content: `${truncate(req.body.comment, 50)}`,
        chatId: req.body.commentId,
        data: {
          type: OSNotificationType.AnnouncementCommentResponse,
          announcementId: req.body.announcementId,
          commentId: req.body.commentId,
          subCommentId: response.data?._id
        }
      });
    }
  }
});

router.post("/subCommentLikeDislike", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSubCommentLikeDislikeAnnouncement, async (req: CustomRequest<AnnouncementSubCommenLikeDisliketDTO>, res: any) => {
  /* #swagger.tags = ['Announcement']
#swagger.description = 'Like or dislike a announcement's sub comment.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AnnouncementSubCommentLikeDislikeRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await AnnouncementAccess.subCommentLikeDislikeAnnouncement(req.selectedLangs(), new AnnouncementSubCommenLikeDisliketDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

export default router;
