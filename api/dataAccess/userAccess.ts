import bcrypt from "bcryptjs"
import { DepartmentEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { FacultyEntity } from "../../stuplus-lib/entities/BaseEntity";
import { SchoolEntity } from "../../stuplus-lib/entities/BaseEntity";
import { EmailConfirmation, ExternalLogin, UserDocument } from "../../stuplus-lib/entities/UserEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { Role } from "../../stuplus-lib/enums/enums";
import { getNewToken } from "../utils/token";
import EmailService from "../../stuplus-lib/services/emailService";
import moment from "moment";
import { checkIfStudentEmail, checkIfValidSchool, generateCode } from "../../stuplus-lib/utils/general";
import { LoginUserDTO, LoginUserGoogleDTO, RegisterUserDTO, UpdateUserInterestsDTO, UpdateUserProfileDTO } from "../dtos/UserDTOs";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { config } from "../config/config";
import axios from "axios";
export class UserAccess {
    public static async getUserWithFields(acceptedLanguages: Array<string>, id: string, fields?: Array<string>): Promise<UserDocument | null> {
        const user = await UserEntity.findOne({ _id: id }, fields, { lean: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        const school = await SchoolEntity.findOne({ _id: user.schoolId });
        const faculty = await FacultyEntity.findOne({ _id: user.facultyId });
        const department = await DepartmentEntity.findOne({ _id: user.departmentId });

        if (school)
            user.schoolName = school.title;

        if (faculty)
            user.facultyName = faculty.title;

        if (department)
            user.departmentName = department.title;

        return user;
    }

    public static async updateProfile(acceptedLanguages: Array<string>, id: string, payload: UpdateUserProfileDTO): Promise<UserDocument | null> {
        const user = await UserEntity.findOneAndUpdate({ _id: id }, payload, { new: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        return user;
    }

    public static async updateInterests(acceptedLanguages: Array<string>, id: string, payload: UpdateUserInterestsDTO): Promise<UserDocument | null> {
        const user = await UserEntity.findOneAndUpdate({ _id: id }, { $set: { 'interestIds': payload.interestIds } }, { new: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        return user;
    }

    public static async updateProfilePhoto(acceptedLanguages: Array<string>, id: string, newPPUrl: string | undefined): Promise<UserDocument | null> {
        if (!newPPUrl)
            throw new NotValidError(getMessage("photoUrlNotFound", acceptedLanguages))

        const user = await UserEntity.findOneAndUpdate({ _id: id }, { $set: { 'profilePhotoUrl': newPPUrl } }, { new: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        return user;
    }

    public static async updatePassword(acceptedLanguages: Array<string>, id: string, payload: any): Promise<UserDocument | null> {
        const user = await UserEntity.findOne({ _id: id });
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
        const user = await UserEntity.findOne({ $or: [{ email: payload.email }, { schoolEmail: payload.email }] });

        if (user)
            throw new NotValidError(getMessage("userAlreadyRegistered", acceptedLanguages));

        payload.password = await bcrypt.hash(payload.password, 10);

        const now = new Date();
        const code = generateCode();

        const isStudentEmail = checkIfStudentEmail(payload.email);
        if (isStudentEmail) {
            const formattedEmail = payload.email?.slice(payload.email.indexOf("@") + 1, payload.email.length - 7);

            const school = await SchoolEntity.findOne({ emailFormat: formattedEmail })
            if (!school)
                throw new NotValidError(getMessage("schoolNotFound", acceptedLanguages));

            payload.schoolEmail = payload.email;
            payload.schoolEmailConfirmation.code = code;
            payload.schoolEmailConfirmation.expiresAt = moment(now).add(30, 'm').toDate();
        } else {
            payload.accEmailConfirmation.code = code;
            payload.accEmailConfirmation.expiresAt = moment(now).add(30, 'm').toDate();
        }
        let counter = 0;
        let username = payload.email.split("@")[0];
        let userWithSearchedUsername = await UserEntity.findOne({ username: username }, { "_id": 0, "username": 1 }, { lean: true });
        while (userWithSearchedUsername) {
            username = payload.email.split("@")[0] + counter;
            userWithSearchedUsername = await UserEntity.findOne({ username: username }, { "_id": 0, "username": 1 }, { lean: true });
            counter++;
        }

        const createdUser = await UserEntity.create({
            ...payload,
            username: username,
            role: Role.User
        });

        const verifyLink = config.DOMAIN + `/account/emailConfirmation?uid=${createdUser._id}&code=${code}&t=${isStudentEmail ? "1" : "0"}`

        await EmailService.sendEmail(
            payload.email,
            "Hesabınızı onaylayın",
            "Hesabınızı onaylamak için linkiniz hazır.",
            `<div>Linke tıklayarak hesabınızı onaylayın: <a href="${verifyLink}" style="text-decoration:underline;">Onaylayın</a></br><span>Kod: ${code}</span></div>`,
        )

        return { token: getNewToken(createdUser) };
    }

    public static async sendConfirmationEmail(acceptedLanguages: Array<string>, userId: string, isStudentEmail: Boolean) {
        const user = await UserEntity.findOne({ _id: userId });

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
            `<div>Linke tıklayarak hesabınızı onaylayın: <a href="${verifyLink}" style="text-decoration:underline;">Onaylayın</a></br><span>Kod: ${code}</span></div>`,
        )
    }

    public static async confirmEmail(acceptedLanguages: Array<string>, userId: string, code: Number, isStudentEmail: Number) {
        const user = await UserEntity.findOne({ _id: userId });

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

    public static async sendConfirmationEmailForgotPassword(acceptedLanguages: Array<string>, email: string) {
        const user = await UserEntity.findOne({ email: email });
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
        user.markModified("fpEmailConfirmation")
        await user.save();
    }

    public static async confirmForgotPasswordCode(acceptedLanguages: Array<string>, email: string, code: Number) {
        const user = await UserEntity.findOne({ email: email });
        if (!user)
            throw new NotValidError(getMessage("noUserFoundWithRelEmail", acceptedLanguages));

        if (moment(new Date()).isAfter(user.fpEmailConfirmation.expiresAt))
            throw new NotValidError(getMessage("codeNotValidExpTime", acceptedLanguages));

        if (user.fpEmailConfirmation.code !== code)
            throw new NotValidError(getMessage("codeNotValid", acceptedLanguages));
    }

    public static async resetPassword(acceptedLanguages: Array<string>, email: string, code: Number, newPassword: string) {
        const user = await UserEntity.findOne({ email: email });
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

        user.markModified("fpEmailConfirmation")
        await user.save();
    }

    public static async loginUser(acceptedLanguages: Array<string>, payload: LoginUserDTO): Promise<object> {
        const user = await UserEntity.findOne({ $or: [{ email: payload.email }, { username: payload.email }] });

        if (!user || !(await bcrypt.compare(payload.password, user.password)))
            throw new NotValidError(getMessage("userNotFoundWithEnteredInfo", acceptedLanguages));

        return { token: getNewToken(user) };
    }

    public static async loginUserWithGoogle(acceptedLanguages: Array<string>, payload: LoginUserGoogleDTO): Promise<object> {
        const req = await axios.get(`${config.GOOGLE_VALIDATION_URL}?id_token=${payload.AccessToken}`)

        let { email, given_name, family_name, sub } = req.data;

        if (!email || !sub)
            throw new NotValidError(getMessage("googleUserInvalid", acceptedLanguages));

        let user = await UserEntity.findOne({
            externalLogins: {
                $elemMatch: {
                    providerId: sub,
                    providerName: "google"
                }
            },
        });

        if (!user) {
            user = await UserEntity.findOne({ email: email });
            if (!user) {
                const password = await bcrypt.hash(generateCode().toString(), 10);
                let counter = 0;
                let username = email.split("@")[0];
                let userWithSearchedUsername = await UserEntity.findOne({ username: username }, { "_id": 0, "username": 1 }, { lean: true });
                while (userWithSearchedUsername) {
                    username = email.split("@")[0] + counter;
                    userWithSearchedUsername = await UserEntity.findOne({ username: username }, { "_id": 0, "username": 1 }, { lean: true });
                    counter++;
                }

                if (!given_name)
                    given_name = username;
                if (!family_name)
                    family_name = "";

                const createdUser = await UserEntity.create({
                    email: email,
                    password: password,
                    isAccEmailConfirmed: true,
                    username: username,
                    role: Role.User,
                    firstName: given_name,
                    lastName: family_name,
                    externalLogins: [{
                        providerId: sub,
                        providerName: "google"
                    }]

                });

                return { token: getNewToken(createdUser) };

            }
            else {
                const newExternalLogin = new ExternalLogin();
                newExternalLogin.providerId = sub;
                newExternalLogin.providerName = "google";
                user.externalLogins.push(newExternalLogin);
                user.markModified("externalLogins");
                await user.save();
            }
        }

        return { token: getNewToken(user) };
    }
}