import { check, validationResult } from "express-validator"
import { ObjectId } from "mongodb";
import { isValidObjectId } from "mongoose";
import { getMessage } from "../../../../stuplus-lib/localization/responseMessages";
import { CustomRequest } from "../../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../../stuplus-lib/utils/base/BaseResponse";
import { Ok } from "../../../../stuplus-lib/utils/base/ResponseObjectResults";

export const validateBlockUser = [
    check('userId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];

export const validateDeleteSinglePM = [
    check('messageId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('chatId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('deleteFor')
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

export const validateClearPMChat = [
    check('chatId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('deleteFor')
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

export const validateUpdateGroupInfo = [
    check('title')
        .isArray({ min: 0 })
        .withMessage((value: any, { req }: any) => getMessage("mustBeArray", req.selectedLangs()))
        .bail(), ,
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
        .bail()
        .custom(async (value, { req }) => {
            for (let i = 0; i < value.length; i++) {
                if (!isValidObjectId(value[i])) {
                    throw new Error(getMessage("incorrectId", req.selectedLangs()));
                }
            }
        }),
    check('hashTags')
        .if((value: any, { req }: any) => value)
        .isArray({ min: 1, max: 20 })
        .withMessage((value: any, { req }: any) => getMessage("hashTagsLimitError", req.selectedLangs()))
        .bail(),
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

export const validateLeaveGroup = [
    check('groupChatId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];

export const validateRemoveFromGroup = [
    check('groupChatId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("mustBeArray", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        })
        .bail(),
    check('userIds')
        .isArray({ min: 1, max: 50 })
        .withMessage((value: any, { req }: any) => getMessage("removeUsersLimit", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            for (let i = 0; i < value.length; i++) {
                if (!isValidObjectId(value[i])) {
                    throw new Error(getMessage("incorrectId", req.selectedLangs()));
                }
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