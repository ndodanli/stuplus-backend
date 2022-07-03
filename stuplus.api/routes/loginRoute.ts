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
    /* #swagger.tags = ['Login']
   #swagger.description = 'Login.' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/LoginRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/LoginResponse"
     }
   } */
    const response = new BaseResponse<object>();
    try {
        response.data = await UserAccess.loginUser(req.selectedLangs(), new LoginUserDTO(req.body));

        response.setMessage(getMessage("loginSuccess", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message)

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/google", validateGoogleLogin, async (req: CustomRequest<LoginUserGoogleDTO>, res: any) => {
    /* #swagger.tags = ['Login']
#swagger.description = 'Login with google(also registers if user not exist).' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/LoginGoogleRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/LoginGoogleResponse"
     }
   } */
    const response = new BaseResponse<object>();
    try {
        response.data = await UserAccess.loginUserWithGoogle(req.selectedLangs(), new LoginUserGoogleDTO(req.body));

        response.setMessage(getMessage("loginSuccess", req.selectedLangs()));
    } catch (err: any) {
        response.setErrorMessage(err.message)

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/register", validateRegister, async (req: CustomRequest<RegisterUserDTO>, res: any) => {
    /* #swagger.tags = ['Login']
#swagger.description = 'Register.' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/LoginRegisterRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/LoginRegisterResponse"
     }
   } */
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
