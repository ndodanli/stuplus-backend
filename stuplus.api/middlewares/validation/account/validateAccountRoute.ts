import { check, validationResult, query } from "express-validator"
import { getMessage } from "../../../../stuplus-lib/localization/responseMessages";
import { NotificationSettings } from "../../../../stuplus-lib/entities/UserEntity";
import { CustomRequest } from "../../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../../stuplus-lib/utils/base/BaseResponse";
import { Ok } from "../../../../stuplus-lib/utils/base/ResponseObjectResults";
import { noUsage } from "../customValidators";
import { isValidObjectId } from "mongoose";

export const validateUpdateSchool = [
    check('schoolId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["İsim"]))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('departmentId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["Soyisim"]))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('grade')
        .notEmpty()
        .withMessage("Grade geçerli değil.")
        .bail(),
    check('secondaryEducation')
        .notEmpty()
        .withMessage("secondaryEducation bool olmalidir.")
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateUpdateProfile = [
    check('firstName')
        .notEmpty()
        .withMessage("İsim boş olamaz.")
        .bail()
        .isLength({ min: 1, max: 50 })
        .withMessage((value: any, { req }: any) => "50 karakterden fazla olamaz.")
        .bail(),
    check('lastName')
        .notEmpty()
        .withMessage("Soyisim boş olamaz.")
        .bail()
        .isLength({ min: 1, max: 50 })
        .withMessage((value: any, { req }: any) => "50 karakterden fazla olamaz.")
        .bail(),
    check('avatarKey')
        .notEmpty()
        .withMessage("Avatar boş olamaz.")
        .bail(),
    check('username')
        .notEmpty()
        .withMessage("Kullanıcı adı boş olamaz.")
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateUpdatePrivacySettings = [
    check('followLimitation')
        .custom(async (value, { req }) => {
            if (value !== 0 && value !== 1) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        })
        .withMessage("followLimitation değeri 0 ile 1 arasında olmalı.")
        .bail(),
    check('messageLimitation')
        .custom(async (value, { req }) => {
            if (value !== 0 && value !== 1) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        })
        .withMessage("messageLimitation değeri 0 ile 1 arasında olmalı.")
        .bail(),
    check('profileStatus')
        .custom(async (value, { req }) => {
            if (value !== 0 && value !== 1) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        })
        .withMessage("profileStatus değeri 0 ile 1 arasında olmalı.")
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateUpdatePassword = [
    check('password')
        .notEmpty()
        .withMessage("Lütfen parolanızı giriniz.")
        .bail(),
    check('newPassword')
        .notEmpty()
        .withMessage("Lütfen yeni parolanızı giriniz.")
        .bail()
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
        .withMessage('Yeni parolanız en az 8 karakterden oluşmalı, en az bir sayı, bir büyük harf ve bir küçük harf içermelidir.')
        .bail(),
    check('newPasswordRepeat')
        .custom(async (newPasswordRepeat, { req }) => {
            if (req.body.newPassword !== newPasswordRepeat) {
                throw new Error("Parolalar eşleşmiyor.")
            }
        })
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateResetPassword = [
    check('code')
        .notEmpty()
        .withMessage("Lütfen doğrulama kodunu gönderin.")
        .bail()
        .isInt({ min: 10000, max: 99999 })
        .withMessage("Doğrulama kodu geçersiz(Sadece sayı [1000-9999]).")
        .bail()
        .isLength({ min: 4 })
        .withMessage("Lütfen doğrulama kodu geçersiz(Minimum uzunluk 4 olmalı).")
        .bail(),
    check('email')
        .notEmpty()
        .withMessage("Lütfen email adresinizi giriniz.")
        .bail()
        .isEmail()
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["E-mail"]))
        .bail(),
    check('newPassword')
        .notEmpty()
        .withMessage("Lütfen yeni parolanızı giriniz.")
        .bail()
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
        .withMessage('Yeni parolanız en az 8 karakterden oluşmalı, en az bir sayı, bir büyük harf ve bir küçük harf içermelidir.')
        .bail(),
    check('newPasswordRepeat')
        .custom(async (newPasswordRepeat, { req }) => {
            if (req.body.newPassword !== newPasswordRepeat) {
                throw new Error("Parolalar eşleşmiyor.")
            }
        })
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateForgotPasswordCode = [
    check('code')
        .notEmpty()
        .withMessage("Lütfen doğrulama kodunu gönderin.")
        .bail()
        .isInt({ min: 10000, max: 99999 })
        .withMessage("Doğrulama kodu geçersiz(Sadece sayı [1000-9999]).")
        .bail()
        .isLength({ min: 4 })
        .withMessage("Lütfen doğrulama kodu geçersiz(Minimum uzunluk 4 olmalı).")
        .bail(),
    check('email')
        .notEmpty()
        .withMessage("Lütfen email adresinizi giriniz.")
        .bail()
        .isEmail()
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["E-mail"]))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateForgotPassword = [
    check('email')
        .notEmpty()
        .withMessage("Lütfen email adresinizi giriniz.")
        .bail()
        .isEmail()
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["E-mail"]))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateUpdateInterests = [
    check('interestIds')
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
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];

export const validateEmailConfirmation = [
    query('t')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("wrongInfo", req.selectedLangs()))
        .bail(),
    query("uid")
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("userNotFound", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    query("code")
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("codeNotFound", req.selectedLangs()))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];

export const validateFollowUser = [
    check('requestedId')
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
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateChangeFollowStatus = [
    check('followId')
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
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateNotifyReadNotifications = [
    check('notificationIds')
        .isArray({ min: 1 })
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateReport = [
    check('userId')
        .if((value: any, { req }: any) => value)
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('messageId')
        .if((value: any, { req }: any) => value)
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('commentId')
        .if((value: any, { req }: any) => value)
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('announcementId')
        .if((value: any, { req }: any) => value)
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .custom(async (value, { req }) => {
            if (!isValidObjectId(value)) {
                throw new Error(getMessage("incorrectId", req.selectedLangs()));
            }
        }),
    check('reportType')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];