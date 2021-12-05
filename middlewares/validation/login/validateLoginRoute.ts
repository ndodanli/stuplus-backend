import { check, validationResult } from "express-validator"
import { CustomRequest } from "../../../utils/base/baseOrganizers";
import BaseResponse from "../../../utils/base/BaseResponse";
import { Ok } from "../../../utils/base/ResponseObjectResults";

export const validateRegister = [
    check('password')
        .notEmpty()
        .withMessage('Parola boş bırakılamaz.')
        .bail()
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1 })
        .withMessage('Parolanız en az 8 karakterden oluşmalı, en az bir sayı, bir büyük harf ve bir küçük harf içermelidir.')
        .bail(),
    check('passwordRepeat')
        .custom(async (passwordRepeat, { req }) => {
            if (req.body.password !== passwordRepeat) {
                throw new Error("Parolalar eşleşmiyor.")
            }
        })
        .bail(),
    check('email')
        .notEmpty()
        .withMessage('E-mail boş bırakılamaz.')
        .bail()
        .isEmail()
        .withMessage("E-mail geçerli değil.")
        .bail(),
    check('schoolId')
        .notEmpty()
        .withMessage('Lütfen okulunuzu seçiniz.')
        .bail()
        .isString()
        .withMessage("Lütfen geçerli bir okul seçiniz.")
        .bail(),
    check('facultyId')
        .notEmpty()
        .withMessage('Lütfen fakültenizi seçiniz.')
        .bail()
        .isString()
        .withMessage("Lütfen geçerli bir fakülte seçiniz.")
        .bail(),
    check('departmentId')
        .notEmpty()
        .withMessage('Lütfen bölümünüzü seçiniz.')
        .bail()
        .isString()
        .withMessage("Lütfen geçerli bir bölüm seçiniz.")
        .bail(),
    check('grade')
        .notEmpty()
        .withMessage('Lütfen sınıfınızı seçiniz.')
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
        .withMessage("Geçersiz profil fotoğraf yolu."),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateLogin = [
    check('password')
        .notEmpty()
        .withMessage('Parola boş bırakılamaz.')
        .bail(),
    check('email')
        .notEmpty()
        .withMessage('E-mail boş bırakılamaz.')
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
