import { Router } from "express"
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { validateAddAnnouncement, validateCommentAnnouncement, validateCommentLikeDislikeAnnouncement, validateLikeDislikeAnnouncement } from "../middlewares/validation/announcement/validateAnnouncementRoute";
import { authorize } from "../middlewares/auth";
import { Role } from "../../stuplus-lib/enums/enums";
import { uploadSingleFileS3 } from "../../stuplus-lib/services/fileService";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { AddAnnouncementDTO, AnnouncementCommenLikeDisliketDTO, AnnouncementCommentDTO, AnnouncementLikeDislikeDTO, GetAnnouncementsForUserDTO } from "../dtos/AnnouncementDTOs";
import { AnnouncementAccess } from "../dataAccess/announcementAccess";
const router = Router();

router.post("/add", authorize([Role.ContentCreator, Role.Admin]), uploadSingleFileS3.single("coverImage", [".png", ".jpg", ".jpeg", ".svg"], "public/announcement/cover_images/", 5242880), validateAddAnnouncement, async (req: CustomRequest<AddAnnouncementDTO>, res: any) => {
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

        await AnnouncementAccess.addAnnouncement(req.selectedLangs(), new AddAnnouncementDTO(req.body), res.locals.user._id);

        response.setMessage(getMessage("announcementAdded", req.selectedLangs()));

    } catch (err: any) {
        response.setErrorMessage(err.message)

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/getAnnouncements", authorize([Role.ContentCreator, Role.User, Role.Admin]), async (req: CustomRequest<GetAnnouncementsForUserDTO>, res: any) => {
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
        response.data = await AnnouncementAccess.getAnnouncementsForUser(req.selectedLangs(), new GetAnnouncementsForUserDTO(req.body), res.locals.user._id);
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
        //
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
        //
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
