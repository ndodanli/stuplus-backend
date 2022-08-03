import { Router } from "express"
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { validateAddAnnouncement, validateCommentAnnouncement, validateCommentLikeDislikeAnnouncement, validateGetAnnouncementsAnnouncement, validateGetCommentsAnnouncement, validateGetSubCommentsAnnouncement, validateLikeDislikeAnnouncement, validateSubCommentAnnouncement, validateSubCommentLikeDislikeAnnouncement } from "../middlewares/validation/announcement/validateAnnouncementRoute";
import { authorize } from "../middlewares/auth";
import { Role } from "../../stuplus-lib/enums/enums";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { AnnouncementAddDTO, AnnouncementCommenLikeDisliketDTO, AnnouncementCommentDTO, AnnouncementLikeDislikeDTO, AnnouncementGetMultipleDTO, AnnouncementGetCommentsDTO, AnnouncementSubCommentDTO, AnnouncementSubCommenLikeDisliketDTO, AnnouncementGetSubCommentsDTO } from "../dtos/AnnouncementDTOs";
import { AnnouncementAccess } from "../dataAccess/announcementAccess";
import axios from "axios";
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
  const response = new BaseResponse<object>();
  try {
    await AnnouncementAccess.commentAnnouncement(req.selectedLangs(), new AnnouncementCommentDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
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

router.post("/getSubComments", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator]), validateGetSubCommentsAnnouncement, async (req: CustomRequest<AnnouncementGetSubCommentsDTO>, res: any) => {
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

router.post("/subComment", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator]), validateSubCommentAnnouncement, async (req: CustomRequest<AnnouncementSubCommentDTO>, res: any) => {
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
  const response = new BaseResponse<object>();
  try {
    response.data = await AnnouncementAccess.subCommentAnnouncement(req.selectedLangs(), new AnnouncementSubCommentDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/subCommentLikeDislike", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator]), validateSubCommentLikeDislikeAnnouncement, async (req: CustomRequest<AnnouncementSubCommenLikeDisliketDTO>, res: any) => {
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
