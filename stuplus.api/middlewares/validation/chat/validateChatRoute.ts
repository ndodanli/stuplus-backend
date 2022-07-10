import { check, validationResult } from "express-validator"
import { ObjectId } from "mongodb";
import { isValidObjectId } from "mongoose";
import { getMessage } from "../../../../stuplus-lib/localization/responseMessages";
import { CustomRequest } from "../../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../../stuplus-lib/utils/base/BaseResponse";
import { Ok } from "../../../../stuplus-lib/utils/base/ResponseObjectResults";

export const validateUpdateGroupInfo = [
    check('title')
        .isArray({ min: 0 })
        .withMessage((value: any, { req }: any) => getMessage("mustBeArray", req.selectedLangs()))
        .bail(),,
    check('type')
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

export const validateCreateGroup = [
    check('userIds')
        .isArray({ min: 0 })
        .withMessage((value: any, { req }: any) => getMessage("mustBeArray", req.selectedLangs()))
        .bail(),,
    check('title')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(), 
    check('type')
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
export const validateSendFileMessage = [
    check('m')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    check('to')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        })
        .bail(), 
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];

export const validateUpdateFileMessage = [
    check('mi')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    check('to')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        })
        .bail(),
    check('ci')
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