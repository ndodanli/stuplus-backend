import { check, validationResult } from "express-validator"
import { getMessage } from "../../../localization/responseMessages";
import { CustomRequest } from "../../../utils/base/baseOrganizers";
import BaseResponse from "../../../utils/base/BaseResponse";
import { Ok } from "../../../utils/base/ResponseObjectResults";

export const validateRegister = [
    check('password')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLanguages()))
        .bail()
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
        .withMessage((value: any, { req }: any) => getMessage("strongPassword", req.selectedLanguages()))
        .bail()
        .isLength({ max: 20 })
        .withMessage((value: any, { req }: any) => getMessage("lengthTooLong", req.selectedLanguages()))
        .bail(),
    check('passwordRepeat')
        .custom(async (passwordRepeat, { req }) => {
            if (req.body.password !== passwordRepeat) {
                throw new Error(getMessage("passwordsDoesntMatch", req.selectedLanguages()))
            }
        })
        .bail(),
    check('email')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLanguages(), ["Email"]))
        .bail()
        .isEmail()
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLanguages(), ["Email"]))
        .bail(),
    check('username')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLanguages(), ["Kullanıcı adı"]))
        .bail()
        .isLength({ min: 4, max: 18 })
        .withMessage((value: any, { req }: any) => getMessage("usernameNotValidLength", req.selectedLanguages()))
        .bail()
        .isAlphanumeric("tr-TR")
        .withMessage((value: any, { req }: any) => getMessage("usernameNotValid", req.selectedLanguages()))
        .bail(),
    check('schoolId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("schoolNotSelected", req.selectedLanguages()))
        .bail()
        .isString()
        .withMessage((value: any, { req }: any) => getMessage("schoolSelectNotValid", req.selectedLanguages()))
        .bail(),
    check('facultyId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("facultyNotSelected", req.selectedLanguages()))
        .bail()
        .isString()
        .withMessage((value: any, { req }: any) => getMessage("facultySelectNotValid", req.selectedLanguages()))
        .bail(),
    check('departmentId')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("departmentNotSelected", req.selectedLanguages()))
        .bail()
        .isString()
        .withMessage((value: any, { req }: any) => getMessage("departmentSelectNotValid", req.selectedLanguages()))
        .bail(),
    check('grade')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("gradeNotSelected", req.selectedLanguages()))
        .bail()
        .isInt({ min: 0, max: 7 })
        .withMessage((value: any, { req }: any) => getMessage("gradeSelectNotValid", req.selectedLanguages()))
        .bail(),
    check('firstName')
        .if((value: any, { req }: any) => value)
        .isLength({ min: 1, max: 50 })
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLanguages(), ["İsim"]))
        .bail(),
    check('lastName')
        .if((value: any, { req }: any) => value)
        .isLength({ min: 1, max: 50 })
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLanguages(), ["Soyisim"]))
        .bail(),
    check('phoneNumber')
        .if((value: any, { req }: any) => value)
        .isMobilePhone(["tr-TR"])
        .not()
        .withMessage((value: any, { req }: any) => getMessage("phoneNumberNotValid", req.selectedLanguages()))
        .bail(),
    check('profilePhotoUrl')
        .if((value: any, { req }: any) => value)
        .isURL()
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLanguages(), ["Profil fotoğraf yolu"]))
        .bail(),
    check('interestIds')
        .isArray({ min: 3 })
        .withMessage((value: any, { req }: any) => getMessage("minInterest", req.selectedLanguages()))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLanguages())));
        next();
    },
];

export const validateLogin = [
    check('password')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLanguages(), ["Parola"]))
        .bail(),
    check('email')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLanguages(), ["Kullanıcı adı ya da email"]))
        .bail()
        .isLength({ min: 4, max: 254 })
        .withMessage((value: any, { req }: any) => getMessage("invalidUsernameOrPassword", req.selectedLanguages()))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLanguages())));
        next();
    },
];
