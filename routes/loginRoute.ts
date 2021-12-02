import { UserModel } from "../models/userModel";
import bcrypt from "bcryptjs"
import UserDTO from "../dtos/UserDTOs";
import { Router } from "express"
import { validateLogin, validateRegister } from "../middlewares/validation/login/validateLoginRoutes"
import BaseResponse from "../utils/base/BaseResponse";
import { InternalError, Ok } from "../utils/base/ResponseObjectResults";
import { getNewToken } from "../utils/auth";
import { Role } from "../enums/enums";
const router = Router();

router.post("/", validateLogin, async (req: any, res: any) => {
    const response = new BaseResponse<object>();
    try {
        const userDTO = new UserDTO(req.body);

        const user = await UserModel.findOne({ Email: userDTO.Email });

        if (!user || !(await bcrypt.compare(userDTO.Password, user.Password))) {
            response.setErrorMessage("Girilen bilgilere ait bir kullanıcımız bulunmamaktadır.");
            return Ok(res, response)
        }

        response.data = { token: getNewToken(user) }

    } catch (err: any) {
        response.setErrorMessage(err.message)

        return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/register", validateRegister, async (req: any, res: any) => {
    const response = new BaseResponse<object>();
    try {

        const userDTO = new UserDTO(req.body);

        const isUserExist = await UserModel.findOne({ Email: userDTO.Email }, { _id: 1 });
        if (isUserExist) {
            response.setErrorMessage("Bu kullanıcı zaten kayıtlı.");
            return Ok(res, response)
        }

        userDTO.Password = await bcrypt.hash(userDTO.Password, 10);
        userDTO.Role = Role.User;

        const createdUser = await UserModel.create({
            ...userDTO,
        });

        response.data = { token: getNewToken(createdUser) }

    } catch (err: any) {
        response.setErrorMessage(err.message)

        return InternalError(res, response);
    }

    return Ok(res, response)
});



export default router;
