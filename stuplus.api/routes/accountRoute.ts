import { Router } from "express";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { authorize } from "../middlewares/auth";
import { UserAccess } from "../dataAccess/userAccess";
import { Role } from "../../stuplus-lib/enums/enums";
import { validateChangeFollowStatus, validateEmailConfirmation, validateFollowUser, validateForgotPassword, validateForgotPasswordCode, validateNotifyReadNotifications, validateReport, validateResetPassword, validateUpdateInterests, validateUpdatePassword, validateUpdateProfile } from "../middlewares/validation/account/validateAccountRoute";
import { UpdateUserInterestsDTO, UpdateUserProfileDTO, UserUnfollowDTO, UserFollowReqDTO, UserFollowUserRequestDTO, UserRemoveFollowerDTO, ReportDTO, NotificationsReadedDTO } from "../dtos/UserDTOs";
import { CustomRequest, CustomResponse } from "../../stuplus-lib/utils/base/baseOrganizers";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import path from "path";
import { uploadFileS3 } from "../../stuplus-lib/services/fileService";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import RedisService from "../../stuplus-lib/services/redisService";
import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { isValidObjectId } from "mongoose";


const router = Router();

router.get("/user", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<object>, res: any) => {
  /* #swagger.tags = ['Account']
          #swagger.description = 'Get user info.' */
  /* #swagger.responses[200] = {
"description": "Success",
"schema": {
"$ref": "#/definitions/GetAccountUserResponse"
}
} */
  const response = new BaseResponse<object>();
  try {
    response.data = await RedisService.acquireUser(res.locals.user._id, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePhotoUrl",
      "role", "grade", "schoolId", "facultyId", "departmentId", "isAccEmailConfirmed",
      "isSchoolEmailConfirmed", "interestIds", "avatarKey", "username", "about", "privacySettings"]);

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getUserProfile/:userId", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<object>, res: any) => {
  /* #swagger.tags = ['Account']
          #swagger.description = 'Get user's profile info.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountGetUserProfileProfileRequest" }
} */
  /* #swagger.responses[200] = {
"description": "Success",
"schema": {
"$ref": "#/definitions/AccountGetUserProfileProfileResponse"
}
} */
  const response = new BaseResponse<object>();
  try {
    response.data = await UserAccess.getUserProfile(req.selectedLangs(), res.locals.user._id, req.body.targetUserId);

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/updateProfile", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateUpdateProfile, async (req: CustomRequest<UpdateUserProfileDTO>, res: any) => {
  /* #swagger.tags = ['Account']
         #swagger.description = 'Update user's profile.' */
  /*	#swagger.requestBody = {
     required: true,
     schema: { $ref: "#/definitions/AccountUpdateProfileRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AccountUpdateProfileResponse"
   }
 } */
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

router.post("/updateInterests", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateUpdateInterests, async (req: CustomRequest<UpdateUserInterestsDTO>, res: any) => {
  /* #swagger.tags = ['Account']
         #swagger.description = 'Update user's interests.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountUpdateInterestsRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AccountUpdateInterestsResponse"
   }
 } */
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

router.post("/updatePassword", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateUpdatePassword, async (req: CustomRequest<object>, res: any) => {
  /* #swagger.tags = ['Account']
         #swagger.description = 'Update user password.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountUpdatePasswordRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AccountUpdatePasswordResponse"
   }
 } */
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
  /* #swagger.tags = ['Account']
         #swagger.description = 'Forgot password(Code will be sended to the email).' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountForgotPasswordRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AccountForgotPasswordResponse"
   }
 } */
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
  /* #swagger.tags = ['Account']
         #swagger.description = 'Confirm forgot password code.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountConfirmForgotPasswordCodeRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AccountConfirmForgotPasswordCodeResponse"
   }
 } */
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
  /* #swagger.tags = ['Account']
       #swagger.description = 'Reset password.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountResetPasswordCodeRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AccountResetPasswordCodeResponse"
   }
 } */
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
  /* #swagger.ignore = true */
  return res.sendFile('email_confirmation.html', { root: path.join(__dirname, '../public') })
});

router.post("/emailConfirmation", validateEmailConfirmation, async (req: CustomRequest<object>, res: any) => {
  /* #swagger.ignore = true */
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

router.post("/sendConfirmationEmail", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<object>, res: any) => {
  /* #swagger.tags = ['Account']
     #swagger.description = 'This is only for user to send email confirmation after logged in if email confirmation some way failed(e.g. mail send failed, confirmation code expired).' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountSendConfirmationEmailRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AccountSendConfirmationEmailResponse"
   }
 } */
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

router.post("/updateProfilePhoto", authorize([Role.User, Role.Admin, Role.ContentCreator]), uploadFileS3.single("profilePhoto", [".png", ".jpg", ".jpeg", ".svg"], "profile_images/", 5242880), async (req: CustomRequest<object>, res: any) => {
  /* #swagger.tags = ['Account']
         #swagger.description = 'Update user's profile photo(accepts only with one of ".png", ".jpg", ".jpeg", ".svg" extensions and 5MB size limit).' */
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
                            }
                        },
                        required: ["profilePhoto"]
                    }
                }
            } 
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/AccountUpdateProfilePhotoResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    if (req.fileValidationErrors?.length) {
      response.validationErrors = req.fileValidationErrors;
      throw new NotValidError(getMessage("fileError", req.selectedLangs()))
    }

    await UserAccess.updateProfilePhoto(req.selectedLangs(), res.locals.user._id, req.file.location)

    response.data = { url: req.file?.location }

    response.setMessage(getMessage("ppUpdated", req.selectedLangs()))

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
})

router.post("/followUser", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateFollowUser, async (req: CustomRequest<UserFollowUserRequestDTO>, res: any) => {
  /* #swagger.tags = ['Account']
        #swagger.description = 'Follow user without privacy limitations.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountFollowUserRequest" }
} */
  /* #swagger.responses[200] = {
    "description": "Success",
    "schema": {
      "$ref": "#/definitions/AccountFollowUserResponse"
    }
  } */
  const response = new BaseResponse<object>();
  try {
    response.data = await UserAccess.followUser(req.selectedLangs(), res.locals.user._id, new UserFollowUserRequestDTO(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response); ``
});

router.post("/unfollowUser", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateChangeFollowStatus, async (req: CustomRequest<UserUnfollowDTO>, res: any) => {
  /* #swagger.tags = ['Account']
        #swagger.description = 'Send following request to user(if privacy limitations = ByRequest).' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountChangeFollowStatusRequest" }
} */
  /* #swagger.responses[200] = {
    "description": "Success",
    "schema": {
      "$ref": "#/definitions/NullResponse"
    }
  } */
  const response = new BaseResponse<object>();
  try {
    await UserAccess.unfollowUser(req.selectedLangs(), res.locals.user._id, new UserUnfollowDTO(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/cancelFollowUserRequest", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateChangeFollowStatus, async (req: CustomRequest<UserFollowReqDTO>, res: any) => {
  /* #swagger.tags = ['Account']
        #swagger.description = 'Cancel the request that sent to the user for following.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountChangeFollowStatusRequest" }
} */
  /* #swagger.responses[200] = {
    "description": "Success",
    "schema": {
      "$ref": "#/definitions/NullResponse"
    }
  } */
  const response = new BaseResponse<object>();
  try {
    await UserAccess.cancelFollowReq(req.selectedLangs(), res.locals.user._id, new UserFollowReqDTO(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/acceptFollowUserRequest", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateChangeFollowStatus, async (req: CustomRequest<UserFollowReqDTO>, res: any) => {
  /* #swagger.tags = ['Account']
        #swagger.description = 'Accept follow request.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountChangeFollowStatusRequest" }
} */
  /* #swagger.responses[200] = {
    "description": "Success",
    "schema": {
      "$ref": "#/definitions/NullResponse"
    }
  } */
  const response = new BaseResponse<object>();
  try {
    await UserAccess.acceptFollowReq(req.selectedLangs(), res.locals.user._id, new UserFollowReqDTO(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/rejectFollowUserRequest", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateChangeFollowStatus, async (req: CustomRequest<UserFollowReqDTO>, res: any) => {
  /* #swagger.tags = ['Account']
        #swagger.description = 'Reject follow request' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountChangeFollowStatusRequest" }
} */
  /* #swagger.responses[200] = {
    "description": "Success",
    "schema": {
      "$ref": "#/definitions/NullResponse"
    }
  } */
  const response = new BaseResponse<object>();
  try {
    await UserAccess.rejectFollowReq(req.selectedLangs(), res.locals.user._id, new UserFollowReqDTO(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/removeFollower", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateChangeFollowStatus, async (req: CustomRequest<UserFollowReqDTO>, res: any) => {
  /* #swagger.tags = ['Account']
        #swagger.description = 'Remove user from followers.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountChangeFollowStatusRequest" }
} */
  /* #swagger.responses[200] = {
    "description": "Success",
    "schema": {
      "$ref": "#/definitions/NullResponse"
    }
  } */
  const response = new BaseResponse<object>();
  try {
    await UserAccess.removeFollower(req.selectedLangs(), res.locals.user._id, new UserRemoveFollowerDTO(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/getFollowRequestsFromMe", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
  /* #swagger.tags = ['Account']
          #swagger.description = 'Get user info.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/BasePaginationRequest" }
} */
  /* #swagger.responses[200] = {
"description": "Success",
"schema": {
"$ref": "#/definitions/AccountGetFollowRequestsFromMeResponse"
}
} */
  const response = new BaseResponse<object>();
  try {
    response.data = await UserAccess.getFollowRequestsFromMe(req.selectedLangs(), res.locals.user._id, new BaseFilter(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/getFollowRequestsToMe", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
  /* #swagger.tags = ['Account']
          #swagger.description = 'Get user info.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/BasePaginationRequest" }
} */
  /* #swagger.responses[200] = {
"description": "Success",
"schema": {
"$ref": "#/definitions/AccountGetFollowRequestsToMeResponse"
}
} */
  const response = new BaseResponse<object>();
  try {
    response.data = await UserAccess.getFollowRequestsToMe(req.selectedLangs(), res.locals.user._id, new BaseFilter(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/getFollowers", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
  /* #swagger.tags = ['Account']
          #swagger.description = 'Get user info.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/BasePaginationRequest" }
} */
  /* #swagger.responses[200] = {
"description": "Success",
"schema": {
"$ref": "#/definitions/AccountGetFollowersResponse"
}
} */
  const response = new BaseResponse<object>();
  try {
    response.data = await UserAccess.getFollowers(req.selectedLangs(), res.locals.user._id, new BaseFilter(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/getFollowing", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
  /* #swagger.tags = ['Account']
          #swagger.description = 'Get user info.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/BasePaginationRequest" }
} */
  /* #swagger.responses[200] = {
"description": "Success",
"schema": {
"$ref": "#/definitions/AccountGetFollowingResponse"
}
} */
  const response = new BaseResponse<object>();
  try {
    response.data = await UserAccess.getFollowing(req.selectedLangs(), res.locals.user._id, new BaseFilter(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/report", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateReport, async (req: CustomRequest<ReportDTO>, res: any) => {
  /* #swagger.tags = ['Account']
    #swagger.description = 'Report something(user, comment, announcement, message' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountReportRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<any>();
  try {
    await UserAccess.report(req.selectedLangs(), res.locals.user._id, new ReportDTO(req.body));

    response.setMessage(getMessage("reportSuccess", req.selectedLangs()));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/getNotificationHistory", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
  /* #swagger.tags = ['Account']
  #swagger.description = 'Get notification history' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/BasePaginationRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/GetNotificationHistoryResponse"
   }
 } */
  const response = new BaseResponse<any>();
  try {
    response.data = await UserAccess.getNotificationHistory(req.selectedLangs(), res.locals.user._id, new BaseFilter(req.body));
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/removeNotification/:notificationId", authorize([Role.User, Role.Admin, Role.ContentCreator]), async (req: CustomRequest<BaseFilter>, res: any) => {
  /* #swagger.tags = ['Account']
#swagger.description = 'Remove notification by id.' */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<any>();
  try {
    const notificationId = req.params.notificationId;
    if (!isValidObjectId(notificationId))
      throw new NotValidError(getMessage("invalidObjectId", req.selectedLangs()));

    await UserAccess.removeNotification(req.selectedLangs(), res.locals.user._id, notificationId);
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.post("/notifyReadNotifications", authorize([Role.User, Role.Admin, Role.ContentCreator]), validateNotifyReadNotifications, async (req: CustomRequest<NotificationsReadedDTO>, res: any) => {
  /* #swagger.tags = ['Account']
#swagger.description = 'Notify readed notifications by sending their ids.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/AccountNotifyReadNotificationsRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<any>();
  try {
    const payload = new NotificationsReadedDTO(req.body);

    await UserAccess.notifyReadNotifications(req.selectedLangs(), res.locals.user._id, payload);
  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

export default router;
