import { Router } from "express";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { authorize } from "../middlewares/auth";
import { UserAccess } from "../dataAccess/userAccess";
import { Role } from "../../stuplus-lib/enums/enums";
import { validateEmailConfirmation, validateForgotPassword, validateForgotPasswordCode, validateResetPassword, validateUpdateInterests, validateUpdatePassword, validateUpdateProfile } from "../middlewares/validation/account/validateAccountRoute";
import { UpdateUserInterestsDTO, UpdateUserProfileDTO } from "../dtos/UserDTOs";
import { CustomRequest, CustomResponse } from "../../stuplus-lib/utils/base/baseOrganizers";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import path from "path";
import { uploadSingleFileS3 } from "../../stuplus-lib/services/fileService";
import NotValidError from "../../stuplus-lib/errors/NotValidError";


const router = Router();

router.get("/user", authorize([Role.User, Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const user = await UserAccess.getUserWithFields(req.selectedLangs(), res.locals.user._id,
      ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePhotoUrl",
        "role", "grade", "schoolId", "facultyId", "departmentId", "isAccEmailConfirmed",
        "isSchoolEmailConfirmed"])

    response.data = user;

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/updateProfile", authorize([Role.User, Role.Admin]), validateUpdateProfile, async (req: CustomRequest<UpdateUserProfileDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    await UserAccess.updateProfile(req.selectedLangs(), res.locals.user._id, new UpdateUserProfileDTO(req.body))

    response.setMessage(getMessage("profileUpdated", req.selectedLangs()))

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/updateInterests", authorize([Role.User, Role.Admin]), validateUpdateInterests, async (req: CustomRequest<UpdateUserInterestsDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    await UserAccess.updateInterests(req.selectedLangs(), res.locals.user._id, new UpdateUserInterestsDTO(req.body))

    response.setMessage(getMessage("interestsUpdated", req.selectedLangs()))

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/updatePassword", authorize([Role.User, Role.Admin]), validateUpdatePassword, async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    await UserAccess.updatePassword(req.selectedLangs(), res.locals.user._id, req.body)

    response.setMessage(getMessage("passwordUpdated", req.selectedLangs()))

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/forgotPassword", validateForgotPassword, async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    await UserAccess.sendConfirmationEmailForgotPassword(req.selectedLangs(), req.body.email)

    response.setMessage(getMessage("fpCodeSended", req.selectedLangs()))

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/confirmForgotPasswordCode", validateForgotPasswordCode, async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    await UserAccess.confirmForgotPasswordCode(req.selectedLangs(), req.body.email, req.body.code)

    response.setMessage(getMessage("fpVerified", req.selectedLangs()))

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/resetPassword", validateResetPassword, async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    await UserAccess.resetPassword(req.selectedLangs(), req.body.email, req.body.code, req.body.newPassword)

    response.setMessage(getMessage("passwordReset", req.selectedLangs()))

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/emailConfirmation", async (req: CustomRequest<object>, res: any) => {
  return res.sendFile('email_confirmation.html', { root: path.join(__dirname, '../public') })
});

router.post("/emailConfirmation", validateEmailConfirmation, async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    await UserAccess.confirmEmail(req.selectedLangs(), req.query.uid as string, Number(req.query.code), Number(req.query.t));

    response.setMessage(getMessage("emailVerified", req.selectedLangs()));

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/sendConfirmationEmail", authorize([Role.User, Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    await UserAccess.sendConfirmationEmail(req.selectedLangs(), res.locals.user._id as string, req.body.isStudentEmail);

    response.setMessage(getMessage("emailVerified", req.selectedLangs()));

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/updateProfilePhoto", authorize([Role.User, Role.Admin]), uploadSingleFileS3.single("photo", [".png", ".jpg", ".jpeg", ".svg"], "public/profile_photos/", 5242880), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    if (req.fileValidationErrors?.length) {
      response.validationErrors = req.fileValidationErrors;
      throw new NotValidError(getMessage("fileError", req.selectedLangs()))
    }

    await UserAccess.updateProfilePhoto(req.selectedLangs(), res.locals.user._id, req.file?.location)

    response.data = { url: req.file?.location }

    response.setMessage(getMessage("ppUpdated", req.selectedLangs()))

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
})

export default router;
