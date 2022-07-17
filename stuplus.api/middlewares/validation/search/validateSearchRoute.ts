import { check, param, validationResult } from "express-validator"
import { CustomRequest } from "../../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../../stuplus-lib/utils/base/BaseResponse";
import { Ok } from "../../../../stuplus-lib/utils/base/ResponseObjectResults";

export const validateSearch = [
    check('searchTerm')
        .notEmpty()
        .withMessage('searchTerm bulunamadı.')
        .bail(),
    check('page')
        .notEmpty()
        .withMessage('pageSize bulunamadı.')
        .bail(),
    check('pageSize')
        .notEmpty()
        .withMessage('pageSize bulunamadı.')
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];