import { check, validationResult, query } from "express-validator"
import { getMessage } from "../../../../stuplus-lib/localization/responseMessages";
import { NotificationSettings } from "../../../../stuplus-lib/entities/UserEntity";
import { CustomRequest } from "../../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../../stuplus-lib/utils/base/BaseResponse";
import { Ok } from "../../../../stuplus-lib/utils/base/ResponseObjectResults";
import { noUsage } from "../customValidators";

export const validateUpdateProfile = [
    check('firstName')
        .if((value: any, { req }: any) => value)
        .isLength({ min: 1, max: 50 })
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["İsim"]))
        .bail(),
    check('lastName')
        .if((value: any, { req }: any) => value)
        .isLength({ min: 1, max: 50 })
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["Soyisim"]))
        .bail(),
    check('phoneNumber')
        .if((value: any, { req }: any) => value)
        .isMobilePhone(["tr-TR"])
        .not()
        .withMessage("Telefon numarası geçerli değil. Lütfen belirtilen formatta giriş yapınız.")
        .bail(),
    // check('profilePhotoUrl')
    //     .if((value: any, { req }: any) => value)
    //     .isURL()
    //     .withMessage("Geçersiz profil fotoğraf yolu.")
    //     .bail(),
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
        .withMessage((value: any, { req }: any) => getMessage("minInterest", req.selectedLangs()))
        .bail(),
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
        .bail(),
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