import { check, validationResult } from "express-validator"
import { isValidObjectId } from "mongoose";
import { getMessage } from "../../../../stuplus-lib/localization/responseMessages";
import { CustomRequest } from "../../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../../stuplus-lib/utils/base/BaseResponse";
import { Ok } from "../../../../stuplus-lib/utils/base/ResponseObjectResults";

export const validateAddQuestion = [
    check('title')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    check('ownerSchoolId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('text')
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

export const validateLikeDislikeQuestion = [
    check('questionId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('type')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .isNumeric({ no_symbols: true })
        .bail(),
    check('beforeType')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .isNumeric({ no_symbols: true })
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];

export const validateCommentQuestion = [
    check('questionId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('comment')
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

export const validateSubCommentQuestion = [
    check('questionId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('commentId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('comment')
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

export const validateCommentLikeDislikeQuestion = [
    check('questionId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('commentId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('type')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .isNumeric({ no_symbols: true })
        .bail(),
    check('beforeType')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .isNumeric({ no_symbols: true })
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];

export const validateSubCommentLikeDislikeQuestion = [
    check('questionId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('commentId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('subCommentId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('type')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .isNumeric({ no_symbols: true })
        .bail(),
    check('beforeType')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .isNumeric({ no_symbols: true })
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];

export const validateGetSubCommentsQuestion = [
    check('commentId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('pageSize')
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

export const validateGetCommentsQuestion = [
    check('questionId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('pageSize')
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

export const validateGetQuestionsQuestion = [
    check('pageSize')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    check('ownerSchoolId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('schoolSearch')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .isBoolean()
        .withMessage((value: any, { req }: any) => getMessage("mustBeBoolean", req.selectedLangs()))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];
