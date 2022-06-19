import { Router } from "express"
import { validateGoogleLogin, validateLogin, validateRegister } from "../middlewares/validation/login/validateLoginRoute"
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { UserAccess } from "../dataAccess/userAccess";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { LoginUserDTO, LoginUserGoogleDTO, RegisterUserDTO } from "../dtos/UserDTOs";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { validateAddAnnouncement } from "../middlewares/validation/announcement/validateAnnouncementRoute";
import { authorize } from "../middlewares/auth";
import { Role } from "../../stuplus-lib/enums/enums";
import { uploadSingleFileS3 } from "../../stuplus-lib/services/fileService";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { AddAnnouncementDTO, GetAnnouncementsForUserDTO } from "../dtos/AnnouncementDTOs";
import { AnnouncementAccess } from "../dataAccess/announcementAccess";
const router = Router();

router.post("/add", authorize([Role.ContentCreator, Role.Admin]), uploadSingleFileS3.single("coverImage", [".png", ".jpg", ".jpeg", ".svg"], "public/announcement/cover_photos/", 5242880), validateAddAnnouncement, async (req: CustomRequest<AddAnnouncementDTO>, res: any) => {
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

router.post("/getAnnouncementsForUser", authorize([Role.ContentCreator, Role.User, Role.Admin]), async (req: CustomRequest<GetAnnouncementsForUserDTO>, res: any) => {
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

export default router;
