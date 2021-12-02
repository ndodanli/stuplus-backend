import { check, validationResult } from "express-validator"
import BaseResponse from "./base/BaseResponse";
import { Ok } from "./base/ResponseObjectResults";

export const validateRegister = [
    check('Password')
        .notEmpty()
        .withMessage('Parola boş bırakılamaz.')
        .bail()
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1 })
        .withMessage('Parolanız en az 8 karakterden oluşmalı, en az bir sayı, bir büyük harf ve bir küçük harf içermelidir.  ')
        .bail(),
    check('Email')
        .notEmpty()
        .withMessage('E-mail boş bırakılamaz.')
        .isEmail()
        .bail()
        .withMessage("E-mail geçerli değil.")
        .bail(),
    (req: any, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];

export const validateLogin = [
    check('Password')
        .notEmpty()
        .withMessage('Parola boş bırakılamaz.')
        .bail(),
    check('Email')
        .notEmpty()
        .withMessage('E-mail boş bırakılamaz.')
        .isEmail()
        .bail()
        .withMessage("E-mail geçerli değil.")
        .bail(),
    (req: any, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, "Lütfen gerekli bilgileri doldurun."));
        next();
    },
];
