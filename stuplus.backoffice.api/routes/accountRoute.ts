import { Router } from "express";
import path from "path";
import { UserAccess } from "../../stuplus.api/dataAccess/userAccess";
import { Role } from "../../stuplus-lib/enums/enums";
import RedisService from "../../stuplus-lib/services/redisService";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { authorize } from "../middlewares/auth";



const router = Router();

router.get("/user", authorize([Role.User, Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const user = await RedisService.acquireUser(res.locals.user._id, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePhotoUrl",
      "role", "grade", "schoolId", "facultyId", "departmentId", "isAccEmailConfirmed",
      "isSchoolEmailConfirmed", "interestIds", "avatarKey", "username"]);

    response.data = user;

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});


export default router;
