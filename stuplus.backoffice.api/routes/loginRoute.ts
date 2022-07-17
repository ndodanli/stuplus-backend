import { Router } from "express"
import { UserAccess } from "../../stuplus.api/dataAccess/userAccess";
import { LoginUserDTO } from "../../stuplus.api/dtos/UserDTOs";
import { validateLogin } from "../../stuplus.api/middlewares/validation/login/validateLoginRoute";
import { UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import bcrypt from "bcryptjs"
import { getNewToken } from "../utils/token";

const router = Router();

router.post("/", validateLogin, async (req: CustomRequest<LoginUserDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const user = await UserEntity.findOne({ $or: [{ email: req.body.email }, { username: req.body.email }] });

    if (!user || !(await bcrypt.compare(req.body.password, user.password)))
      throw new NotValidError(getMessage("userNotFoundWithEnteredInfo", ["tr"]));

    response.data = { token: getNewToken(user) };

    response.setMessage(getMessage("loginSuccess", ["tr"]));
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

export default router;
