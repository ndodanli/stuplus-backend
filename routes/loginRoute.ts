import { Router } from "express"
import { validateLogin, validateRegister } from "../middlewares/validation/login/validateLoginRoute"
import BaseResponse from "../utils/base/BaseResponse";
import { InternalError, Ok } from "../utils/base/ResponseObjectResults";
import { UserAccess } from "../dataAccess/userAccess";
import { CustomRequest } from "../utils/base/baseOrganizers";
import { LoginUserDTO, RegisterUserDTO } from "../dtos/UserDTOs";
import { getMessage } from "../localization/responseMessages";
const router = Router();

router.post("/", validateLogin, async (req: CustomRequest<LoginUserDTO>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        response.data = await UserAccess.loginUser(req.selectedLanguages(), new LoginUserDTO(req.body));

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
        response.data = await UserAccess.registerUser(req.selectedLanguages(), new RegisterUserDTO(req.body))

        response.setMessage(getMessage("accountCreated", req.selectedLanguages()))

    } catch (err: any) {
        response.setErrorMessage(err.message)

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response)
});

export default router;
