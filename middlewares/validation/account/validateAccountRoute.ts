import { check, validationResult } from "express-validator"
import { NotificationSettings } from "../../../models/UserModel";
import { CustomRequest } from "../../../utils/base/baseOrganizers";
import BaseResponse from "../../../utils/base/BaseResponse";
import { Ok } from "../../../utils/base/ResponseObjectResults";
import { noUsage } from "../customValidators";

export const validateUpdateProfile = [
    check('notificationSettings')
        .custom(noUsage)
        .bail(),
    check('chatSettings')
        .custom(noUsage)
        .bail(),
    check('roomIds')
        .custom(noUsage)
        .bail(),
    check('blockedUserIds')
        .custom(noUsage)
        .bail(),
    check('interestIds')
        .custom(noUsage)
        .bail(),
    check('friendIds')
        .custom(noUsage)
        .bail(),
    check('takenFriendRequestIds')
        .custom(noUsage)
        .bail(),
    check('sendedFriendRequestIds')
        .custom(noUsage)
        .bail(),
    check('schoolId')
        .optional()
        .bail()
        .isString()
        .withMessage("Lütfen geçerli bir okul seçiniz.")
        .bail(),
    check('facultyId')
        .optional()
        .bail()
        .isString()
        .withMessage("Lütfen geçerli bir fakülte seçiniz.")
        .bail(),
    check('departmentId')
        .optional()
        .bail()
        .isString()
        .withMessage("Lütfen geçerli bir bölüm seçiniz.")
        .bail(),
    check('grade')
        .optional()
        .bail()
        .isInt({ min: 0, max: 7 })
        .withMessage("Lütfen geçerli bir sınıf seçiniz.")
        .bail(),
    check('firstName')
        .optional()
        .bail()
        .isLength({ min: 1, max: 50 })
        .withMessage("İsim geçerli değil.")
        .bail(),
    check('lastName')
        .optional()
        .bail()
        .isLength({ min: 1, max: 50 })
        .withMessage("Soyisim geçerli değil.")
        .bail(),
    check('phoneNumber')
        .optional()
        .bail()
        .isMobilePhone(["tr-TR"])
        .not()
        .withMessage("Telefon numarası geçerli değil. Lütfen belirtilen formatta giriş yapınız.")
        .bail(),
    check('profilePhotoUrl')
        .optional()
        .bail()
        .isURL()
        .withMessage("Geçersiz profil fotoğraf yolu.")
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        if (req.body["schoolId"] || req.body["facultyId"] || req.body["departmentId"]) {
            if (!req.body["schoolId"] || !req.body["facultyId"] || !req.body["departmentId"]) {
                return Ok(res, new BaseResponse(true, [], null, "Okul bilgileri eksik."));
            }
        }
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
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1 })
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
        .isInt({ min: 1000, max: 9999 })
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
        .withMessage("E-mail geçerli değil.")
        .bail(),
    check('newPassword')
        .notEmpty()
        .withMessage("Lütfen yeni parolanızı giriniz.")
        .bail()
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1 })
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
        .isInt({ min: 1000, max: 9999 })
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
        .withMessage("E-mail geçerli değil.")
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
        .withMessage("E-mail geçerli değil.")
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];