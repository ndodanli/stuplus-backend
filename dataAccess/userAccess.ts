import { convertToObject } from "typescript";
import bcrypt from "bcryptjs"
import { DepartmentModel, UserModel } from "../models/BaseModel";
import { FacultyModel } from "../models/BaseModel";
import { SchoolModel } from "../models/BaseModel";
import { UserDocument } from "../models/UserModel";
import NotValidError from "../errors/NotValidError";
import { Role } from "../enums/enums";
import { getNewToken } from "../utils/auth";
import EmailService from "../services/emailService";
import moment from "moment";
import { generateCode } from "../utils/general";
import { LoginUserDTO, RegisterUserDTO, UpdateUserProfileDTO } from "../dtos/UserDTOs";
export class UserAccess {
    public static async getUserWithFields(id: string, fields?: Array<string>): Promise<UserDocument | null> {
        const user = await UserModel.findOne({ _id: id }, fields, { lean: convertToObject });

        if (!user) throw new NotValidError("Kullanıcı bulunamadı.");

        const school = await SchoolModel.findOne({ _id: user?.schoolId });
        const faculty = await FacultyModel.findOne({ _id: user?.facultyId });
        const department = await DepartmentModel.findOne({ _id: user?.departmentId });

        if (school && faculty && department) {
            user.schoolName = school.title;
            user.facultyName = faculty.title;
            user.departmentName = department.title;
        }
        return user;
    }

    public static async updateProfile(id: string, payload: UpdateUserProfileDTO): Promise<UserDocument | null> {
        const user = await UserModel.findOneAndUpdate({ _id: id }, payload, { new: true, lean: convertToObject });

        if (!user) throw new NotValidError("Kullanıcı bulunamadı.");

        return user;
    }

    public static async updatePassword(id: string, payload: any): Promise<UserDocument | null> {
        const user = await UserModel.findOne({ _id: id });
        if (!user) throw new NotValidError("Kullanıcı bulunamadı.");

        if (!(await bcrypt.compare(payload.password, user.password)))
            throw new NotValidError("Parolanız doğru değil.");

        if ((await bcrypt.compare(payload.newPassword, user.password)))
            throw new NotValidError("Yeni parolanız eskisiyle aynı olamaz.");

        user.password = await bcrypt.hash(payload.newPassword, 10);
        await user.save();

        return user;
    }

    public static async registerUser(payload: RegisterUserDTO): Promise<object> {

        const isUserExist = await UserModel.findOne({ $or: [{ email: payload.email }, { username: payload.username }] }, { _id: 1 });

        if (isUserExist) throw new NotValidError("Bu kullanıcı zaten kayıtlı.");

        payload.password = await bcrypt.hash(payload.password, 10);
        payload.role = Role.User;

        const createdUser = await UserModel.create({
            ...payload
        });

        return { token: getNewToken(createdUser) };
    }

    public static async loginUser(payload: LoginUserDTO): Promise<object> {
        const user = await UserModel.findOne({ $or: [{ email: payload.email }, { username: payload.email }] });

        if (!user || !(await bcrypt.compare(payload.password, user.password)))
            throw new NotValidError(("Girilen bilgilere ait bir kullanıcımız bulunmamaktadır."));

        return { token: getNewToken(user) };
    }

    public static async sendConfirmationEmailForgotPassword(email: string) {
        const user = await UserModel.findOne({ email: email });
        if (!user)
            throw new NotValidError("Bu e-maile sahip bir kullanıcımız bulunmamaktadır.");

        const now = new Date()
        const validDate = moment(user.emailConfirmation.expiresAt).subtract(9, 'm').toDate()
        if (moment(now).isBefore(validDate))
            throw new NotValidError("Parola sıfırlama kodunuz kısa süre önce gönderildi. Lütfen bir dakika bekleyip tekrar deneyin.");

        const code = generateCode();

        user.emailConfirmation.code = code;
        user.emailConfirmation.expiresAt = moment(now).add(10, 'm').toDate();

        await EmailService.sendEmail(
            user.email,
            "Şifrenizi sıfırlayın ✔",
            "Güvenlik kodunuz ile şifrenizi sıfırlayın.",
            `<div>Güvenlik kodunuz: <b>${code}</b></div>`,
        )
        user.markModified("emailConfirmation")
        await user.save();
    }

    public static async confirmForgotPasswordCode(email: string, code: Number) {
        const user = await UserModel.findOne({ email: email });
        if (!user)
            throw new NotValidError("İlgili e-maile sahip kullanıcı bulunamadığından doğrulama sağlanamadı.");

        if (moment(new Date()).isAfter(user.emailConfirmation.expiresAt))
            throw new NotValidError("Doğrulama kodunuz geçersiz. Biraz geç mi kaldınız? Lütfen tekrar deneyin.");

        if (user.emailConfirmation.code !== code)
            throw new NotValidError("Doğrulama kodunuz geçersiz.");
    }

    public static async resetPassword(email: string, code: Number, newPassword: string) {
        const user = await UserModel.findOne({ email: email });
        if (!user)
            throw new NotValidError("İlgili e-maile sahip kullanıcı bulunamadığından doğrulama sağlanamadı.");

        if (moment(new Date()).isAfter(user.emailConfirmation.expiresAt))
            throw new NotValidError("Doğrulama kodunuzun süresi bitti. Biraz geç mi kaldınız? Lütfen tekrar deneyin.");

        if (user.emailConfirmation.code != code)
            throw new NotValidError("Doğrulama kodunuz geçersiz. Yasadışı işler yapmaya çalışıyorsanız lütfen uzak durun.");

        user.password = await bcrypt.hash(newPassword, 10);

        user.emailConfirmation.code = null;

        user.markModified("emailConfirmation")
        await user.save();
    }

}