import { Role } from "../../../stuplus-lib/enums/enums_socket";
import jwt from "jsonwebtoken";
import { CustomRequest } from "../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../stuplus-lib/utils/base/BaseResponse";
import { Ok } from "../../../stuplus-lib/utils/base/ResponseObjectResults";

export const authorizeSocket = (token: string) => {
    let decode;
    if (token) {
        const onlyToken = token.slice(7, token.length);
        decode = jwt.verify(onlyToken, process.env.JWT_SECRET || "", (err: any, decode: any) => {
            if (err) {
                return null;
            }
            return decode;
        });
    }
    return decode;
}

export const authorize = (role: Role[]) => {
    return (req: CustomRequest<object>, res: any, next: any) => {
        const token = req.headers.authorization;
        if (token) {
            const onlyToken = token.slice(7, token.length);
            jwt.verify(onlyToken, process.env.JWT_SECRET || "", (err: any, decode: any) => {
                if (err || !role.includes(decode.role)) {
                    return Ok(res, new BaseResponse<null>(true, [], null, "Bu işlem için yetkiniz yok!"));
                }
                res.locals.user = decode;
                next();
                return;
            });
        } else {
            return Ok(res, new BaseResponse<null>(true, [], null, "Kullanıcı Bulunamadı"));
        }
    };
}