import { Router } from "express"
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { validateAddAnnouncement, validateCommentAnnouncement, validateCommentLikeDislikeAnnouncement, validateGetAnnouncementsAnnouncement, validateGetCommentsAnnouncement, validateLikeDislikeAnnouncement } from "../middlewares/validation/announcement/validateAnnouncementRoute";
import { authorize } from "../middlewares/auth";
import { Role } from "../../stuplus-lib/enums/enums";
import { uploadSingleFileS3 } from "../../stuplus-lib/services/fileService";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { AnnouncementAddDTO, AnnouncementCommenLikeDisliketDTO, AnnouncementCommentDTO, AnnouncementLikeDislikeDTO, AnnouncementGetMultipleDTO, AnnouncementGetSingleDTO, AnnouncementGetCommentsDTO } from "../dtos/AnnouncementDTOs";
import { AnnouncementAccess } from "../dataAccess/announcementAccess";
const router = Router();

router.post("/add", authorize([Role.ContentCreator, Role.Admin]), uploadSingleFileS3.single("coverImage", [".png", ".jpg", ".jpeg", ".svg"], "announcement/cover_images/", 5242880), validateAddAnnouncement, async (req: CustomRequest<AnnouncementAddDTO>, res: any) => {
    /* #swagger.tags = ['Announcement']
       #swagger.description = 'Add an announcement.' */
    /*	#swagger.requestBody = {
   required: true,
  "@content": {
                 "multipart/form-data": {
                     schema: {
                         type: "object",
                         properties: {
                             profilePhoto: {
                                 type: "string",
                                 format: "binary"
                             },
                             title: {
                                 type: "string",
                             },
                             text: {
                                 type: "string",
                             },
                             relatedSchoolIds: {
                                 type: "array",
                             }
                         },
                         required: ["title", "text", "relatedSchoolIds"]
                     }
                 }
             } 
 } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/NullResponse"
     }
   } */
    const response = new BaseResponse<object>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }

        req.body.coverImageUrl = req.file?.location;

        await AnnouncementAccess.addAnnouncement(req.selectedLangs(), new AnnouncementAddDTO(req.body), res.locals.user._id);

        response.setMessage(getMessage("announcementAdded", req.selectedLangs()));

    } catch (err: any) {
        response.setErrorMessage(err.message)

        if (err.status != 200)
            return InternalError(res, response);
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
            return InternalError(res, response);
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
            return InternalError(res, response);
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
            return InternalError(res, response);
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
            return InternalError(res, response);
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
            return InternalError(res, response);
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
            return InternalError(res, response);
    }

    return Ok(res, response)
});

export default router;
