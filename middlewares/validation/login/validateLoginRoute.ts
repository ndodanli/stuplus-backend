import { check, validationResult } from "express-validator"
import { getMessage } from "../../../config/responseMessages";
import { CustomRequest } from "../../../utils/base/baseOrganizers";
import BaseResponse from "../../../utils/base/BaseResponse";
import { Ok } from "../../../utils/base/ResponseObjectResults";

export const validateRegister = [
    check('password')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.acceptsLanguages()))
        .bail()
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
        .withMessage((value: any, { req }: any) => getMessage("strongPassword", req.acceptsLanguages()))
        .bail()
        .isLength({ max: 20 })
        .withMessage((value: any, { req }: any) => getMessage("lengthTooLong", req.acceptsLanguages()))
        .bail(),
    check('passwordRepeat')
        .custom(async (passwordRepeat, { req }) => {
            if (req.body.password !== passwordRepeat) {
                throw new Error(getMessage("passwordsDoesntMatch", req.acceptsLanguages()))
            }
        })
        .bail(),
    check('email')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.acceptsLanguages(), ["Email"]))
        .bail()
        .isEmail()
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.acceptsLanguages(), ["Email"]))
        .bail(),
    check('username')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.acceptsLanguages(), ["Kullanıcı adı"]))
        .bail()
        .isLength({ min: 4, max: 18 })
        .withMessage((value: any, { req }: any) => getMessage("usernameNotValidLength", req.acceptsLanguages()))
        .bail()
        .isAlphanumeric("tr-TR")
        .withMessage((value: any, { req }: any) => getMessage("usernameNotValid", req.acceptsLanguages()))
        .bail(),
    check('schoolId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("schoolNotSelected", req.acceptsLanguages()))
        .bail()
        .isString()
        .withMessage((value: any, { req }: any) => getMessage("schoolSelectNotValid", req.acceptsLanguages()))
        .bail(),
    check('facultyId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("facultyNotSelected", req.acceptsLanguages()))
        .bail()
        .isString()
        .withMessage((value: any, { req }: any) => getMessage("facultySelectNotValid", req.acceptsLanguages()))
        .bail(),
    check('departmentId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("departmentNotSelected", req.acceptsLanguages()))
        .bail()
        .isString()
        .withMessage((value: any, { req }: any) => getMessage("departmentSelectNotValid", req.acceptsLanguages()))
        .bail(),
    check('grade')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("gradeNotSelected", req.acceptsLanguages()))
        .bail()
        .isInt({ min: 0, max: 7 })
        .withMessage((value: any, { req }: any) => getMessage("gradeSelectNotValid", req.acceptsLanguages()))
        .bail(),
    check('firstName')
        .if((value: any, { req }: any) => value)
        .isLength({ min: 1, max: 50 })
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.acceptsLanguages(), ["İsim"]))
        .bail(),
    check('lastName')
        .if((value: any, { req }: any) => value)
        .isLength({ min: 1, max: 50 })
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.acceptsLanguages(), ["Soyisim"]))
        .bail(),
    check('phoneNumber')
        .if((value: any, { req }: any) => value)
        .isMobilePhone(["tr-TR"])
        .not()
        .withMessage((value: any, { req }: any) => getMessage("phoneNumberNotValid", req.acceptsLanguages()))
        .bail(),
    check('profilePhotoUrl')
        .if((value: any, { req }: any) => value)
        .isURL()
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.acceptsLanguages(), ["Profil fotoğraf yolu"]))
        .bail(),
    check('interestIds')
        .isArray({ min: 3 })
        .withMessage((value: any, { req }: any) => getMessage("minInterest", req.acceptsLanguages()))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.acceptsLanguages())));
        next();
    },
];

export const validateLogin = [
    check('password')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.acceptsLanguages(), ["Parola"]))
        .bail(),
    check('email')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.acceptsLanguages(), ["Kullanıcı adı ya da email"]))
        .bail()
        .isLength({ min: 4, max: 254 })
        .withMessage((value: any, { req }: any) => getMessage("invalidUsernameOrPassword", req.acceptsLanguages()))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.acceptsLanguages())));
        next();
    },
];
