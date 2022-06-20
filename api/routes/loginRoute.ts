import { Router } from "express"
import { validateGoogleLogin, validateLogin, validateRegister } from "../middlewares/validation/login/validateLoginRoute"
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { UserAccess } from "../dataAccess/userAccess";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { LoginUserDTO, LoginUserGoogleDTO, RegisterUserDTO } from "../dtos/UserDTOs";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
const router = Router();

router.post("/", validateLogin, async (req: CustomRequest<LoginUserDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        response.data = await UserAccess.loginUser(req.selectedLangs(), new LoginUserDTO(req.body));

    } catch (err: any) {
        response.setErrorMessage(err.message)

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/google", validateGoogleLogin, async (req: CustomRequest<LoginUserGoogleDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        response.data = await UserAccess.loginUserWithGoogle(req.selectedLangs(), new LoginUserGoogleDTO(req.body));

    } catch (err: any) {
        response.setErrorMessage(err.message)

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/register", validateRegister, async (req: CustomRequest<RegisterUserDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        response.data = await UserAccess.registerUser(req.selectedLangs(), new RegisterUserDTO(req.body))

        response.setMessage(getMessage("accountCreated", req.selectedLangs()))

    } catch (err: any) {
        response.setErrorMessage(err.message)

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response)
});

export default router;