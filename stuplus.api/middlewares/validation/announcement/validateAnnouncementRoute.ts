import { check, validationResult } from "express-validator"
import { getMessage } from "../../../../stuplus-lib/localization/responseMessages";
import { CustomRequest } from "../../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../../stuplus-lib/utils/base/BaseResponse";
import { Ok } from "../../../../stuplus-lib/utils/base/ResponseObjectResults";

export const validateAddAnnouncement = [
    check('title')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    check('text')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    check('relatedSchoolIds')
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

export const validateLikeDislikeAnnouncement = [
    check('announcementId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
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

export const validateCommentAnnouncement = [
    check('announcementId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
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

export const validateCommentLikeDislikeAnnouncement = [
    check('announcementId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    check('commentId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
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


export const validateGetCommentsAnnouncement = [
    check('announcementId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
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

export const validateGetAnnouncementsAnnouncement = [
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
