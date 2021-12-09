import { Router } from "express";
import BaseResponse from "../utils/base/BaseResponse";
import { InternalError, Ok } from "../utils/base/ResponseObjectResults";
import { authorize } from "../middlewares/auth";
import { UserAccess } from "../dataAccess/userAccess";
import { Role } from "../enums/enums";
import { validateForgotPassword, validateForgotPasswordCode, validateResetPassword, validateUpdatePassword, validateUpdateProfile } from "../middlewares/validation/account/validateAccountRoute";
import { UpdateUserProfileDTO } from "../dtos/UserDTOs";
import { CustomRequest, CustomResponse } from "../utils/base/baseOrganizers";
import { uploadFileToS3, uploadWithMulterS3 } from "../services/fileService";
import multer from "multer";

const upload = multer();

const router = Router();

router.get("/user", authorize([Role.User, Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const user = await UserAccess.getUserWithFields(req.user._id, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePhotoUrl", "role", "grade", "schoolId", "facultyId", "departmentId"])

    response.data = user;

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/updateProfile", uploadWithMulterS3.any(), validateUpdateProfile, async (req: CustomRequest<UpdateUserProfileDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {

    const fileErrors = req.fileValidationErrors;
    // uploadFileToS3(req.file, "testFileName");
    // await UserAccess.updateProfile(req.user._id, new UpdateUserProfileDTO(req.body))

    response.setMessage("Hesabınız başarıyla güncellendi.")

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
    await UserAccess.updatePassword(req.user._id, req.body)

    response.setMessage("Parolanız başarıyla güncellendi.")

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
    await UserAccess.sendConfirmationEmailForgotPassword(req.body.email)

    response.setMessage("Parola sıfırlama kodunuz başarıyla e-mail adresinize gönderildi.")

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
    await UserAccess.confirmForgotPasswordCode(req.body.email, req.body.code)

    response.setMessage("Parola sıfırlama kodunuz başarıyla doğrulandı.")

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
    await UserAccess.resetPassword(req.body.email, req.body.code, req.body.newPassword)

    response.setMessage("Parolanız başarıyla sıfırlandı.")

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

export default router;
