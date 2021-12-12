import { Router } from "express";
import BaseResponse from "../utils/base/BaseResponse";
import { InternalError, Ok } from "../utils/base/ResponseObjectResults";
import { authorize } from "../middlewares/auth";
import { UserAccess } from "../dataAccess/userAccess";
import { Role } from "../enums/enums";
import { validateEmailConfirmation, validateForgotPassword, validateForgotPasswordCode, validateResetPassword, validateUpdateInterests, validateUpdatePassword, validateUpdateProfile } from "../middlewares/validation/account/validateAccountRoute";
import { UpdateUserInterestsDTO, UpdateUserProfileDTO } from "../dtos/UserDTOs";
import { CustomRequest, CustomResponse } from "../utils/base/baseOrganizers";
import { getMessage } from "../config/responseMessages";
import path from "path";


const router = Router();

router.get("/user", authorize([Role.User, Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const user = await UserAccess.getUserWithFields(req.acceptsLanguages(), req.user._id, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePhotoUrl", "role", "grade", "schoolId", "facultyId", "departmentId"])

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
    await UserAccess.updateProfile(req.acceptsLanguages(), req.user._id, new UpdateUserProfileDTO(req.body))

    response.setMessage(getMessage("profileUpdated", req.acceptsLanguages()))

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
    await UserAccess.updateInterests(req.acceptsLanguages(), req.user._id, new UpdateUserInterestsDTO(req.body))

    response.setMessage(getMessage("interestsUpdated", req.acceptsLanguages()))

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
    await UserAccess.updatePassword(req.acceptsLanguages(), req.user._id, req.body)

    response.setMessage(getMessage("passwordUpdated", req.acceptsLanguages()))

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
    await UserAccess.sendConfirmationEmailForgotPassword(req.acceptsLanguages(), req.body.email)

    response.setMessage(getMessage("fpCodeSended", req.acceptsLanguages()))

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
    await UserAccess.confirmForgotPasswordCode(req.acceptsLanguages(), req.body.email, req.body.code)

    response.setMessage(getMessage("fpVerified", req.acceptsLanguages()))

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
    await UserAccess.resetPassword(req.acceptsLanguages(), req.body.email, req.body.code, req.body.newPassword)

    response.setMessage(getMessage("passwordReset", req.acceptsLanguages()))

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
    await UserAccess.confirmEmail(req.acceptsLanguages(), req.query.uid as string, Number(req.query.code), Number(req.query.isStudentEmail));

    response.setMessage(getMessage("emailVerified", req.acceptsLanguages()));

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
    await UserAccess.sendConfirmationEmail(req.acceptsLanguages(), req.user._id as string, req.body.isStudentEmail);

    response.setMessage(getMessage("emailVerified", req.acceptsLanguages()));

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

export default router;
