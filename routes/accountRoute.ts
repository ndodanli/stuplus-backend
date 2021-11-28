import User from "../models/userModel";
import { Router } from "express"
import BaseResponse from "../utils/base/BaseResponse";
import { InternalError, Ok } from "../utils/base/ResponseObjectResults";
import { isAuth } from "../utils/auth";
const router = Router();

router.get("/user", isAuth, async (req: any, res: any) => {
  const response = new BaseResponse<object>();
  try {

    const user = await User.findOne({ _id: req.user._id }, { _id: 0, Password: 0, Role: 0, __v: 0 });

    if (!user) {
      response.setErrorMessage("Kullanıcı bulunamadı.");
      return Ok(res, response)
    }

    response.data = user 

  } catch (err: any) {
    response.setErrorMessage(err.message)

    return InternalError(res, response);
  }

  return Ok(res, response)
});

export default router;
