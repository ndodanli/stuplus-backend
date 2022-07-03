import { config } from "../config/config";
import jwt from "jsonwebtoken";
import { Role } from "../../stuplus-lib/enums/enums";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";

export const authorize = (roles: Role[]) => {
    return (req: CustomRequest<object>, res: any, next: any) => {
        // #swagger.ignore = true
        const token = req.headers.authorization;
        if (token) {
            const onlyToken = token.slice(7, token.length);
            jwt.verify(onlyToken, process.env.JWT_SECRET || config.JWT_SECRET, (err: any, decode: any) => {
                if (err || !roles.includes(decode.role)) {
                    return Ok(res, new BaseResponse<null>(true, [], null, "Bu işlem için yetkiniz yok!"));
                }
                res.locals.user = decode;
                next();
                return;
            });
        } else {
            return Ok(res, new BaseResponse<null>(true, [], null, getMessage("unauthorized", req.selectedLangs())));
        }
    };
}