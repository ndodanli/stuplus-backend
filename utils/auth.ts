import { config } from "../config/config";
import jwt from "jsonwebtoken";
import { Ok } from "./base/ResponseObjectResults";
import BaseResponse from "./base/BaseResponse";
import { Role } from "../enums/enums";
import { CustomRequest } from "./base/baseOrganizers";

export const getNewToken = (user: any) => {
    return jwt.sign(
        {
            _id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET || config.JWT_SECRET,
        {
            expiresIn: "30d",
        }
    );
};

export const authorize = (role: Role[]) => {
    return (req: CustomRequest<object>, res: any, next: any) => {
        const token = req.headers.authorization;
        if (token) {
            const onlyToken = token.slice(7, token.length);
            jwt.verify(onlyToken, config.JWT_SECRET, (err: any, decode: any) => {
                if (err || !role.includes(decode.role)) {
                    return Ok(res, new BaseResponse<null>(true, [], null, "Bu işlem için yetkiniz yok!"));
                }
                req.user = decode;
                next();
                return;
            });
        } else {
            return Ok(res, new BaseResponse<null>(true, [], null, "Kullanıcı Bulunamadı"));
        }
    };
}