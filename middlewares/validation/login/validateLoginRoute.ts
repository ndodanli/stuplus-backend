import { check, validationResult } from "express-validator"
import { getMessage } from "../../../localization/responseMessages";
import { CustomRequest } from "../../../utils/base/baseOrganizers";
import BaseResponse from "../../../utils/base/BaseResponse";
import { Ok } from "../../../utils/base/ResponseObjectResults";

export const validateRegister = [
    check('password')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs()))
        .bail()
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
        .withMessage((value: any, { req }: any) => getMessage("strongPassword", req.selectedLangs()))
        .bail()
        .isLength({ max: 20 })
        .withMessage((value: any, { req }: any) => getMessage("lengthTooLong", req.selectedLangs()))
        .bail(),
    check('passwordRepeat')
        .custom(async (passwordRepeat, { req }) => {
            if (req.body.password !== passwordRepeat) {
                throw new Error(getMessage("passwordsDoesntMatch", req.selectedLangs()))
            }
        })
        .bail(),
    check('email')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs(), ["Email"]))
        .bail()
        .isEmail()
        .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["Email"]))
        .bail(),
	check('gender')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs(), ["Cinsiyet"]))
        .bail(),
    // check('username')
        // .notEmpty()
        // .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs(), ["Kullanıcı adı"]))
        // .bail()
        // .isLength({ min: 4, max: 18 })
        // .withMessage((value: any, { req }: any) => getMessage("usernameNotValidLength", req.selectedLangs()))
        // .bail()
        // .isAlphanumeric("tr-TR")
        // .withMessage((value: any, { req }: any) => getMessage("usernameNotValid", req.selectedLangs()))
        // .bail(),
    // check('schoolId')
        // .notEmpty()
        // .withMessage((value: any, { req }: any) => getMessage("schoolNotSelected", req.selectedLangs()))
        // .bail()
        // .isString()
        // .withMessage((value: any, { req }: any) => getMessage("schoolSelectNotValid", req.selectedLangs()))
        // .bail(),
    // check('facultyId')
        // .notEmpty()
        // .withMessage((value: any, { req }: any) => getMessage("facultyNotSelected", req.selectedLangs()))
        // .bail()
        // .isString()
        // .withMessage((value: any, { req }: any) => getMessage("facultySelectNotValid", req.selectedLangs()))
        // .bail(),
    // check('departmentId')
        // .notEmpty()
        // .withMessage((value: any, { req }: any) => getMessage("departmentNotSelected", req.selectedLangs()))
        // .bail()
        // .isString()
        // .withMessage((value: any, { req }: any) => getMessage("departmentSelectNotValid", req.selectedLangs()))
        // .bail(),
    // check('grade')
        // .notEmpty()
        // .withMessage((value: any, { req }: any) => getMessage("gradeNotSelected", req.selectedLangs()))
        // .bail()
        // .isInt({ min: 0, max: 7 })
        // .withMessage((value: any, { req }: any) => getMessage("gradeSelectNotValid", req.selectedLangs()))
        // .bail(),
    // check('firstName')
        // .if((value: any, { req }: any) => value)
        // .isLength({ min: 1, max: 50 })
        // .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["İsim"]))
        // .bail(),
    // check('lastName')
        // .if((value: any, { req }: any) => value)
        // .isLength({ min: 1, max: 50 })
        // .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["Soyisim"]))
        // .bail(),
    // check('phoneNumber')
        // .if((value: any, { req }: any) => value)
        // .isMobilePhone(["tr-TR"])
        // .not()
        // .withMessage((value: any, { req }: any) => getMessage("phoneNumberNotValid", req.selectedLangs()))
        // .bail(),
    // check('profilePhotoUrl')
        // .if((value: any, { req }: any) => value)
        // .isURL()
        // .withMessage((value: any, { req }: any) => getMessage("xNotValid", req.selectedLangs(), ["Profil fotoğraf yolu"]))
        // .bail(),
    // check('interestIds')
        // .isArray({ min: 3 })
        // .withMessage((value: any, { req }: any) => getMessage("minInterest", req.selectedLangs()))
        // .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];

export const validateLogin = [
    check('password')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs(), ["Parola"]))
        .bail(),
    check('email')
        .notEmpty()
        .withMessage((value: any, { req }: any) => getMessage("emptyError", req.selectedLangs(), ["Kullanıcı adı ya da email"]))
        .bail()
        .isLength({ min: 4, max: 254 })
        .withMessage((value: any, { req }: any) => getMessage("invalidUsernameOrPassword", req.selectedLangs()))
        .bail(),
    (req: CustomRequest<object>, res: any, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return Ok(res, new BaseResponse(true, errors.array(), null, getMessage("fillInReqFields", req.selectedLangs())));
        next();
    },
];
