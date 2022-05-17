import { convertToObject } from "typescript";
import bcrypt from "bcryptjs"
import { DepartmentModel, UserModel } from "../models/BaseModel";
import { FacultyModel } from "../models/BaseModel";
import { SchoolModel } from "../models/BaseModel";
import { UserDocument } from "../models/UserModel";
import NotValidError from "../errors/NotValidError";
import { Role } from "../enums/enums";
import { getNewToken } from "../utils/token";
import EmailService from "../services/emailService";
import moment from "moment";
import { checkIfStudentEmail, checkIfValidSchool, generateCode } from "../utils/general";
import { LoginUserDTO, RegisterUserDTO, UpdateUserInterestsDTO, UpdateUserProfileDTO } from "../dtos/UserDTOs";
import { getMessage } from "../localization/responseMessages";
import { config } from "../config/config";
export class UserAccess {
    public static async getUserWithFields(acceptedLanguages: Array<string>, id: string, fields?: Array<string>): Promise<UserDocument | null> {
        const user = await UserModel.findOne({ _id: id }, fields, { lean: convertToObject });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        const school = await SchoolModel.findOne({ _id: user.schoolId });
        const faculty = await FacultyModel.findOne({ _id: user.facultyId });
        const department = await DepartmentModel.findOne({ _id: user.departmentId });

        if (school)
            user.schoolName = school.title;

        if (faculty)
            user.facultyName = faculty.title;

        if (department)
            user.departmentName = department.title;

        return user;
    }

    public static async updateProfile(acceptedLanguages: Array<string>, id: string, payload: UpdateUserProfileDTO): Promise<UserDocument | null> {
        const user = await UserModel.findOneAndUpdate({ _id: id }, payload, { new: true, lean: convertToObject });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        return user;
    }

    public static async updateInterests(acceptedLanguages: Array<string>, id: string, payload: UpdateUserInterestsDTO): Promise<UserDocument | null> {
        const user = await UserModel.findOneAndUpdate({ _id: id }, { $set: { 'interestIds': payload.interestIds } }, { new: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        return user;
    }

    public static async updateProfilePhoto(acceptedLanguages: Array<string>, id: string, newPPUrl: string | undefined): Promise<UserDocument | null> {
        if (!newPPUrl)
            throw new NotValidError(getMessage("photoUrlNotFound", acceptedLanguages))

        const user = await UserModel.findOneAndUpdate({ _id: id }, { $set: { 'profilePhotoUrl': newPPUrl } }, { new: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        return user;
    }

    public static async updatePassword(acceptedLanguages: Array<string>, id: string, payload: any): Promise<UserDocument | null> {
        const user = await UserModel.findOne({ _id: id });
        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        if (!(await bcrypt.compare(payload.password, user.password)))
            throw new NotValidError(getMessage("passwordNotTrue", acceptedLanguages));

        if ((await bcrypt.compare(payload.newPassword, user.password)))
            throw new NotValidError(getMessage("passwordCanNotBeSameAsOld", acceptedLanguages));

        user.password = await bcrypt.hash(payload.newPassword, 10);
        await user.save();

        return user;
    }

    public static async registerUser(acceptedLanguages: Array<string>, payload: RegisterUserDTO): Promise<object> {
        const user = await UserModel.findOne({ $or: [{ email: payload.email }, { schoolEmail: payload.email }, { username: payload.username }] });

        if (user)
            throw new NotValidError(getMessage("userAlreadyRegistered", acceptedLanguages));

        payload.password = await bcrypt.hash(payload.password, 10);
        payload.role = Role.User;

        const now = new Date();
        const code = generateCode();

        const isStudentEmail = checkIfStudentEmail(payload.email);
        if (isStudentEmail) {
            const school = await SchoolModel.findOne({ _id: payload.schoolId })
            if (!school)
                throw new NotValidError(getMessage("schoolNotFound", acceptedLanguages));

            if (!checkIfValidSchool(payload.email, school.emailFormat))
                throw new NotValidError(getMessage("schoolNotValid", acceptedLanguages));

            payload.schoolEmail = payload.email;
            payload.schoolEmailConfirmation.code = code;
            payload.schoolEmailConfirmation.expiresAt = moment(now).add(30, 'm').toDate();
        } else {
            payload.accEmailConfirmation.code = code;
            payload.accEmailConfirmation.expiresAt = moment(now).add(30, 'm').toDate();
        }

        const createdUser = await UserModel.create({
            ...payload
        });

        const verifyLink = config.DOMAIN + `/account/emailConfirmation?uid=${createdUser._id}&code=${code}&t=${isStudentEmail ? "1" : "0"}`

        await EmailService.sendEmail(
            payload.email,
            "Hesabınızı onaylayın",
            "Hesabınızı onaylamak için linkiniz hazır.",
            `<div>Linke tıklayarak hesabınızı onaylayın: <a href="${verifyLink}" style="text-decoration:underline;">Onaylayın</a></div>`,
        )

        return { token: getNewToken(createdUser) };
    }

    public static async sendConfirmationEmail(acceptedLanguages: Array<string>, userId: string, isStudentEmail: Boolean) {
        const user = await UserModel.findOne({ _id: userId });

        if (!user)
            throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        const now = new Date();
        const code = generateCode();


        if (isStudentEmail) {
            if (user.isSchoolEmailConfirmed)
                throw new NotValidError(getMessage("schoolEmailAlreadyConfirmed", acceptedLanguages));

            if (!user.schoolEmail)
                throw new NotValidError(getMessage("schoolEmailNotFound", acceptedLanguages));

            if (moment(now).isBefore(moment(user.schoolEmailConfirmation.expiresAt).subtract(29, 'm').toDate()))
                throw new NotValidError(getMessage("codeRecentlySent", acceptedLanguages));

            user.schoolEmailConfirmation.code = code;
            user.schoolEmailConfirmation.expiresAt = moment(now).add(30, 'm').toDate();
            user.markModified("schoolEmailConfirmation");
        } else {
            if (user.isAccEmailConfirmed)
                throw new NotValidError(getMessage("accountEmailAlreadyConfirmed", acceptedLanguages));

            if (moment(now).isBefore(moment(user.accEmailConfirmation.expiresAt).subtract(29, 'm').toDate()))
                throw new NotValidError(getMessage("codeRecentlySent", acceptedLanguages));

            user.accEmailConfirmation.code = code;
            user.accEmailConfirmation.expiresAt = moment(now).add(30, 'm').toDate();
            user.markModified("accEmailConfirmation");
        }

        user.save();

        const verifyLink = config.DOMAIN + `/account/emailConfirmation?uid=${user._id}&code=${code}&t=${isStudentEmail ? "1" : "0"}`
        const validEmail = isStudentEmail ? user.schoolEmail : user.email
        if (!validEmail)
            throw new NotValidError(getMessage("noRecipientsFound", acceptedLanguages))
        await EmailService.sendEmail(
            validEmail,
            "Hesabınızı onaylayın",
            "Hesabınızı onaylamak için linkiniz hazır.",
            `<div>Linke tıklayarak hesabınızı onaylayın: <a href="${verifyLink}" style="text-decoration:underline;">Onaylayın</a></div>`,
        )
    }

    public static async confirmEmail(acceptedLanguages: Array<string>, userId: string, code: Number, isStudentEmail: Number) {
        const user = await UserModel.findOne({ _id: userId });

        if (!user)
            throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        if (user.isAccEmailConfirmed && !isStudentEmail)
            throw new NotValidError(getMessage("accountEmailAlreadyConfirmed", acceptedLanguages));

        if (user.isSchoolEmailConfirmed && isStudentEmail)
            throw new NotValidError(getMessage("schoolEmailAlreadyConfirmed", acceptedLanguages));

        if (moment(new Date()).isAfter(isStudentEmail ? user.schoolEmailConfirmation.expiresAt : user.accEmailConfirmation.expiresAt))
            throw new NotValidError(getMessage("confirmationNotValidExpTime", acceptedLanguages));

        if (isStudentEmail ? user.schoolEmailConfirmation.code !== code : user.accEmailConfirmation.code !== code)
            throw new NotValidError(getMessage("confirmationNotValid", acceptedLanguages));

        if (user.email == user.schoolEmail) {
            user.schoolEmailConfirmation.code = null;
            user.isSchoolEmailConfirmed = true;
            user.markModified("schoolEmailConfirmation");
            user.accEmailConfirmation.code = null;
            user.isAccEmailConfirmed = true;
            user.markModified("accEmailConfirmation");
        } else if (isStudentEmail) {
            user.schoolEmailConfirmation.code = null;
            user.isSchoolEmailConfirmed = true;
            user.markModified("schoolEmailConfirmation");
        } else {
            user.accEmailConfirmation.code = null;
            user.isAccEmailConfirmed = true;
            user.markModified("accEmailConfirmation");
        }

        user.save();
    }

    public static async loginUser(acceptedLanguages: Array<string>, payload: LoginUserDTO): Promise<object> {
        const user = await UserModel.findOne({ $or: [{ email: payload.email }, { username: payload.email }] });

        if (!user || !(await bcrypt.compare(payload.password, user.password)))
            throw new NotValidError(getMessage("userNotFoundWithEnteredInfo", acceptedLanguages));

        return { token: getNewToken(user) };
    }

    public static async sendConfirmationEmailForgotPassword(acceptedLanguages: Array<string>, email: string) {
        const user = await UserModel.findOne({ email: email });
        if (!user)
            throw new NotValidError(getMessage("userNotFoundWithThisEmail", acceptedLanguages));

        if (!user.accEmailConfirmation)
            throw new NotValidError(getMessage("cantSendWithoutEmailConfirm", acceptedLanguages));

        const now = new Date()
        const validDate = moment(user.fpEmailConfirmation.expiresAt).subtract(9, 'm').toDate()
        if (moment(now).isBefore(validDate))
            throw new NotValidError(getMessage("codeRecentlySent", acceptedLanguages));

        const code = generateCode();

        user.fpEmailConfirmation.code = code;
        user.fpEmailConfirmation.expiresAt = moment(now).add(10, 'm').toDate();

        await EmailService.sendEmail(
            user.email,
            "Şifrenizi sıfırlayın ✔",
            "Güvenlik kodunuz ile şifrenizi sıfırlayın.",
            `<div>Güvenlik kodunuz: <b>${code}</b></div>`,
        )
        user.markModified("emailConfirmation")
        await user.save();
    }

    public static async confirmForgotPasswordCode(acceptedLanguages: Array<string>, email: string, code: Number) {
        const user = await UserModel.findOne({ email: email });
        if (!user)
            throw new NotValidError(getMessage("noUserFoundWithRelEmail", acceptedLanguages));

        if (moment(new Date()).isAfter(user.fpEmailConfirmation.expiresAt))
            throw new NotValidError(getMessage("codeNotValidExpTime", acceptedLanguages));

        if (user.fpEmailConfirmation.code !== code)
            throw new NotValidError(getMessage("codeNotValid", acceptedLanguages));
    }

    public static async resetPassword(acceptedLanguages: Array<string>, email: string, code: Number, newPassword: string) {
        const user = await UserModel.findOne({ email: email });
        if (!user)
            throw new NotValidError(getMessage("noUserFoundWithRelEmail", acceptedLanguages));

        if (moment(new Date()).isAfter(user.fpEmailConfirmation.expiresAt))
            throw new NotValidError(getMessage("codeNotValidExpTime", acceptedLanguages));

        if (user.fpEmailConfirmation.code != code)
            throw new NotValidError(getMessage("codeNotValidNoTry", acceptedLanguages));

        if ((await bcrypt.compare(newPassword, user.password)))
            throw new NotValidError(getMessage("passwordCanNotBeSameAsOld", acceptedLanguages));

        user.password = await bcrypt.hash(newPassword, 10);

        user.fpEmailConfirmation.code = null;

        user.markModified("emailConfirmation")
        await user.save();
    }

}