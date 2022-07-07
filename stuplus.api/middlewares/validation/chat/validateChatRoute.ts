import { check, validationResult } from "express-validator"
import { getMessage } from "../../../../stuplus-lib/localization/responseMessages";
import { CustomRequest } from "../../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../../stuplus-lib/utils/base/BaseResponse";
import { Ok } from "../../../../stuplus-lib/utils/base/ResponseObjectResults";

export const validateSendFileMessage = [
    check('m')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    check('ci')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    check('to')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];