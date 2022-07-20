import bcrypt from "bcryptjs"
import { FollowEntity, FollowRequestEntity, GroupChatEntity, NotificationEntity, ReportEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { SchoolEntity } from "../../stuplus-lib/entities/BaseEntity";
import { ExternalLogin, UserDocument } from "../../stuplus-lib/entities/UserEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { FollowLimitation, FollowStatus, NotificationType, RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { getNewToken } from "../utils/token";
import EmailService from "../../stuplus-lib/services/emailService";
import moment from "moment-timezone";
import { checkIfStudentEmail, generateCode, searchable, searchables } from "../../stuplus-lib/utils/general";
import { LoginUserDTO, LoginUserGoogleDTO, RegisterUserDTO, UpdateUserInterestsDTO, UpdateUserProfileDTO, UserUnfollowDTO, UserFollowReqDTO, UserFollowUserRequestDTO, UserRemoveFollowerDTO, ReportDTO, NotificationsReadedDTO, UpdateUserSchoolDTO, UpdatePrivacySettingsDTO } from "../dtos/UserDTOs";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { config } from "../config/config";
import axios from "axios";
import RedisService from "../../stuplus-lib/services/redisService";
import { UserProfileResponseDTO } from "../dtos/response/UserResponseDTOs";
import { RedisKeyType, RedisSubKeyType, WatchRoomTypes } from "../../stuplus-lib/enums/enums_socket";
import cronTimes from "../../stuplus-lib/constants/cronTimes";
import redisTTL from "../../stuplus-lib/constants/redisTTL";
import { FollowRequestDocument } from "../../stuplus-lib/entities/FollowRequestEntity";
import { BaseFilter } from "../../stuplus-lib/dtos/baseFilter";
import { FollowDocument } from "../../stuplus-lib/entities/FollowEntity";
import { io } from "../socket";
import { userWatchRoomName } from "../../stuplus-lib/utils/namespaceCreators";
import { NotificationDocument } from "../../stuplus-lib/entities/NotificationEntity";
import { GroupAccess } from "./groupAccess";
import { AddToGroupChatDTO } from "../socket/dtos/Chat";
export class UserAccess {
    public static async getUserProfile(acceptedLanguages: Array<string>, userId: string, targetUserId: string): Promise<UserProfileResponseDTO | null> {
        const response = new UserProfileResponseDTO();
        response.user = await RedisService.acquireUser(targetUserId, ["_id", "firstName", "lastName", "profilePhotoUrl",
            "role", "grade", "schoolId", "departmentId", "isAccEmailConfirmed", "relatedSchoolIds",
            "isSchoolEmailConfirmed", "interestIds", "avatarKey", "username", "about", "privacySettings", "lastSeenDate", "blockedUserIds"]);

        if (response.user.blockedUserIds.includes(userId))
            throw new NotValidError(getMessage("userBlockedShowProfile", acceptedLanguages));

        response.user.followerCount = await RedisService.acquire(RedisKeyType.User + targetUserId + RedisSubKeyType.FollowerCount, redisTTL.SECONDS_10, async () => {
            return await FollowEntity.countDocuments({ followingId: targetUserId });
        });
        response.user.followingCount = await RedisService.acquire(RedisKeyType.User + targetUserId + RedisSubKeyType.FollowerCount, redisTTL.SECONDS_10, async () => {
            return await FollowEntity.countDocuments({ followerId: targetUserId });
        });

        let followEntity = await FollowEntity.findOne({ followerId: userId, followingId: targetUserId }, { "_id": 1 });

        if (!followEntity) {
            let followReqEntity = await FollowRequestEntity.findOne({ ownerId: userId, requestedId: targetUserId }, { "_id": 1 });
            if (!followReqEntity) {
                response.followStatus = response.followStatus = {
                    followId: null,
                    status: FollowStatus.None
                }
            } else {
                response.followStatus = {
                    followId: followReqEntity.id,
                    status: FollowStatus.Pending
                }
            }
        }
        else {
            response.followStatus = {
                followId: followEntity.id,
                status: FollowStatus.Accepted
            }
        }

        return response;
    }

    public static async updatePlayerId(acceptedLanguages: Array<string>, userId: string, playerId: string): Promise<boolean> {
        await UserEntity.findOneAndUpdate({ _id: userId }, { playerId: playerId });
        return true;
    }

    public static async updateSchool(acceptedLanguages: Array<string>, id: string, payload: UpdateUserSchoolDTO): Promise<Boolean> {
        const user = await UserEntity.findOne({ _id: id });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));
        let firstTime = false;
        if (!user.schoolId) {
            firstTime = true;
            user.schoolId = payload.schoolId;
        }
        if (!user.departmentId)
            user.departmentId = payload.departmentId;
        user.grade = payload.grade;
        user.secondaryEducation = payload.secondaryEducation;

        await user.save();

        if (firstTime) {
            const userGroupChats = await GroupChatEntity.find({
                schoolId: user.schoolId,
                departmentId: user.departmentId,
                grade: user.grade,
                secondaryEducation: user.secondaryEducation
            }, { _id: 1 });
            const userGroupChatIds = userGroupChats.map(groupChat => groupChat._id);

            for (let i = 0; i < userGroupChatIds.length; i++) {
                const gcId = userGroupChatIds[i];
                const addToGroupChatPayload = new AddToGroupChatDTO({
                    groupChatId: gcId,
                    userIds: [user._id.toString()],
                });

                await GroupAccess.addUsersToGroupChat(acceptedLanguages, "62ab8a204166fd1eaebbb3fa", addToGroupChatPayload, true);
            }
        }
        await RedisService.updateUser(user);

        return true;
    }

    public static async updatePrivacySettings(acceptedLanguages: Array<string>, id: string, payload: UpdatePrivacySettingsDTO): Promise<Boolean> {
        const user = await UserEntity.findOne({ _id: id });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        user.privacySettings.followLimitation = payload.followLimitation;
        user.privacySettings.messageLimitation = payload.messageLimitation;
        user.markModified("privacySettings");

        await user.save();
        await RedisService.updateUser(user);

        return true;
    }

    public static async updateProfile(acceptedLanguages: Array<string>, id: string, payload: UpdateUserProfileDTO): Promise<UserDocument | null> {
        const user = await UserEntity.findOne({ _id: id });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        if (user.username !== payload.username) {
            let userWithSearchedUsername = await UserEntity.exists({ username: payload.username, recordStatus: RecordStatus.Active });
            if (userWithSearchedUsername)
                throw new NotValidError(getMessage("usernameAlreadyExists", acceptedLanguages));
            if (user.updateTimeLimits.lastUsernameUpdate &&
                user.updateTimeLimits.lastUsernameUpdate > moment().subtract(7, "days").toDate())
                throw new NotValidError(`${getMessage("usernameUpdateLimit", acceptedLanguages)} ${moment(user.updateTimeLimits.lastUsernameUpdate).tz("Europe/Istanbul").add(7, "days").format("YYYY-MM-DD HH:mm:ss")}`);
            else
                user.updateTimeLimits.lastUsernameUpdate = new Date();
        }

        if (user.firstName !== payload.firstName) {
            if (user.updateTimeLimits.lastFirstNameUpdate &&
                user.updateTimeLimits.lastFirstNameUpdate > moment().subtract(1, "days").toDate())
                throw new NotValidError(`${getMessage("firstNameUpdateLimit", acceptedLanguages)} ${moment(user.updateTimeLimits.lastFirstNameUpdate).tz("Europe/Istanbul").add(1, "days").format("YYYY-MM-DD HH:mm:ss")}`);
            else
                user.updateTimeLimits.lastFirstNameUpdate = new Date();
        }

        if (user.lastName !== payload.lastName) {
            if (user.updateTimeLimits.lastLastNameUpdate &&
                user.updateTimeLimits.lastLastNameUpdate > moment().subtract(1, "days").toDate())
                throw new NotValidError(`${getMessage("lastNameUpdateLimit", acceptedLanguages)} ${moment(user.updateTimeLimits.lastLastNameUpdate).tz("Europe/Istanbul").add(1, "days").format("YYYY-MM-DD HH:mm:ss")}`);
            else
                user.updateTimeLimits.lastLastNameUpdate = new Date();
        }

        user.username = payload.username;
        user.firstName = payload.firstName;
        user.lastName = payload.lastName;
        user.avatarKey = payload.avatarKey;
        user.about = payload.about;

        await user.save();
        await RedisService.updateUser(user);

        io.in(userWatchRoomName(user.id)).emit("cWatchUsers", {
            id: user.id,
            t: WatchRoomTypes.UserProfileChanged,
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                about: user.about,
                avatarKey: user.avatarKey,
                username: user.username
            }
        });

        return user;
    }

    public static async updateInterests(acceptedLanguages: Array<string>, id: string, payload: UpdateUserInterestsDTO): Promise<UserDocument | null> {
        const user = await UserEntity.findOneAndUpdate({ _id: id }, { $set: { 'interestIds': payload.interestIds } }, { new: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        await RedisService.updateUser(user);

        return user;
    }

    public static async updateProfilePhoto(acceptedLanguages: Array<string>, id: string, newPPUrl: string | undefined): Promise<UserDocument | null> {
        if (!newPPUrl)
            throw new NotValidError(getMessage("photoUrlNotFound", acceptedLanguages))

        const user = await UserEntity.findOneAndUpdate({ _id: id }, { $set: { 'profilePhotoUrl': newPPUrl } }, { new: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        await RedisService.updateUser(user);

        io.in(userWatchRoomName(user.id)).emit("cWatchUsers", {
            id: user.id,
            t: WatchRoomTypes.UserPPChanged,
            data: {
                profilePhotoUrl: newPPUrl
            }
        });

        return user;
    }

    public static async updatePassword(acceptedLanguages: Array<string>, id: string, payload: any): Promise<any | null> {
        const user = await UserEntity.findOne({ _id: id });
        const response: { validationErrors: any[], hasError: boolean } = { validationErrors: [], hasError: false };
        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        if (!(await bcrypt.compare(payload.password, user.password))) {
            response.hasError = true;
            response.validationErrors.push({
                value: "password",
                msg: getMessage("passwordNotTrue", acceptedLanguages),
                param: "password",
                location: "body"
            });
            return response;
        }
        if ((await bcrypt.compare(payload.newPassword, user.password))) {
            response.hasError = true;
            response.validationErrors.push({
                value: "password",
                msg: getMessage("passwordCanNotBeSameAsOld", acceptedLanguages),
                param: "password",
                location: "body"
            });
            return response;
        }

        user.password = await bcrypt.hash(payload.newPassword, 10);
        await user.save();

        await RedisService.updateUser(user);

        return response;
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
        const randomNames = ["John", "Jane", "Mary", "Tom", "Bob", "Alice", "John", "Jane", "Mary", "Tom", "Bob", "Alice"];
        const randomSurnames = ["Doe", "Smith", "Jones", "Williams", "Brown", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson"];

        const createdUser = await UserEntity.create({
            ...payload,
            username: username,
            avatarKey: username,
            role: Role.User,
            lastSeenDate: now,
            firstName: randomNames[Math.floor(Math.random() * randomNames.length)],
            lastName: randomSurnames[Math.floor(Math.random() * randomSurnames.length)],
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

    public static async sendConfirmationEmail(acceptedLanguages: Array<string>, currentUserId: string, isStudentEmail: Boolean) {
        const user = await UserEntity.findOne({ _id: currentUserId });

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

        await RedisService.updateUser(user);

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

        await RedisService.updateUser(user);
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

        await RedisService.updateUser(user);
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

        await RedisService.updateUser(user);
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
                    }],
                    lastSeenDate: new Date(),
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

    public static async acceptFollowReq(acceptedLanguages: Array<string>, userId: string, payload: UserFollowReqDTO): Promise<boolean> {
        //TODO: send notification
        const followRequest = await FollowRequestEntity.findOne({ _id: payload.followId, requestedId: userId });
        if (!followRequest)
            throw new NotValidError(getMessage("xNotFound", acceptedLanguages, ["Follow request"]));

        const rollbackStatus = {
            status: followRequest.status,
            recordStatus: followRequest.recordStatus
        }

        followRequest.status = FollowStatus.Accepted;
        followRequest.recordStatus = RecordStatus.Deleted;

        const followEntity = new FollowEntity({
            followerId: followRequest.ownerId,
            followingId: followRequest.requestedId
        });

        const notifications = [];
        notifications.push(new NotificationEntity({
            ownerId: followRequest.ownerId,
            relatedUserId: followRequest.requestedId,
            type: NotificationType.FollowRequestAccepted
        }));
        notifications.push(new NotificationEntity({
            ownerId: followRequest.requestedId,
            relatedUserId: followRequest.ownerId,
            type: NotificationType.StartedFollowingYou
        }));
        try {
            await Promise.all([
                followRequest.save(),
                FollowEntity.create(followEntity),
                NotificationEntity.insertMany(notifications)
            ]);
        } catch (error) {
            followRequest.status = rollbackStatus.status;
            followRequest.recordStatus = rollbackStatus.recordStatus;
            await followRequest.save();
            await FollowEntity.deleteOne({
                _id: followEntity._id
            });
            await NotificationEntity.deleteOne({
                relatedUserId: followRequest.requestedId,
                ownerId: followRequest.ownerId,
                type: NotificationType.FollowRequestAccepted
            });
            await NotificationEntity.deleteOne({
                relatedUserId: followRequest.ownerId,
                ownerId: followRequest.requestedId,
                type: NotificationType.StartedFollowingYou
            });
            throw error;
        }

        //TODO: send notification to user

        return true;
    }

    public static async rejectFollowReq(acceptedLanguages: Array<string>, userId: string, payload: UserFollowReqDTO): Promise<boolean> {
        const followRequest = await FollowRequestEntity.findOneAndUpdate({ _id: payload.followId, requestedId: userId }, { status: FollowStatus.Rejected, recordStatus: RecordStatus.Deleted });
        if (!followRequest)
            throw new NotValidError(getMessage("xNotFound", acceptedLanguages, ["Follow request"]));

        //TODO: send notification to user *maybe

        return true;
    }

    public static async cancelFollowReq(acceptedLanguages: Array<string>, userId: string, payload: UserFollowReqDTO): Promise<boolean> {
        const followRequest = await FollowRequestEntity.findOneAndUpdate({ _id: payload.followId, ownerId: userId }, { status: FollowStatus.Cancelled, recordStatus: RecordStatus.Deleted });
        if (!followRequest)
            throw new NotValidError(getMessage("xNotFound", acceptedLanguages, ["Follow request"]));

        return true;
    }

    public static async followUser(acceptedLanguages: Array<string>, userId: string, payload: UserFollowUserRequestDTO): Promise<object> {
        let followId: string;
        const response: { followId: string, followStatus: FollowStatus } = { followId: "", followStatus: FollowStatus.None };
        const user = await UserEntity.findOne({ _id: payload.requestedId }, { "privacySettings": 1, "_id": 0, "blockedUserIds": 1 }).lean(true);

        if (!user)
            throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        if (user.blockedUserIds.includes(userId))
            throw new NotValidError(getMessage("userBlockedFollowReq", acceptedLanguages));

        if (user?.privacySettings.followLimitation == FollowLimitation.None) {
            //TODO: alt yorum satirini uygulamak yerine belirli periyotlarda duplicateler kontrol edilebilir, simdilik geciyoruz
            const follow = await FollowEntity.exists({ followerId: userId, followingId: payload.requestedId, recordStatus: RecordStatus.Active });
            if (follow)
                throw new NotValidError(getMessage("alreadyFollowing", acceptedLanguages));

            //TODO: followingId'ye sahip user var mi kontrol edilmiyor. *maybe
            const followEntity = await FollowEntity.create({
                followerId: userId,
                followingId: payload.requestedId
            });
            followId = followEntity.id;
            response.followStatus = FollowStatus.Accepted;
            response.followId = followId;
        } else {
            const followReq = await FollowRequestEntity.exists({ ownerId: userId, requestedId: payload.requestedId, recordStatus: RecordStatus.Active });
            if (followReq)
                throw new NotValidError(getMessage("alreadySentFollowReq", acceptedLanguages));

            //TODO: followingId'ye sahip user var mi kontrol edilmiyor. *maybe
            const followReqEntity = await FollowRequestEntity.create({
                ownerId: userId,
                requestedId: payload.requestedId
            });
            followId = followReqEntity.id;
            response.followStatus = FollowStatus.Pending;
            response.followId = followId;
        }

        return response;
    }

    public static async unfollowUser(acceptedLanguages: Array<string>, userId: string, payload: UserUnfollowDTO): Promise<boolean> {

        const unfollow = await FollowEntity.findOneAndUpdate({ _id: payload.followId, followerId: userId }, { recordStatus: RecordStatus.Deleted });
        if (!unfollow)
            throw new NotValidError(getMessage("noUserToUnfollow", acceptedLanguages));

        return true;
    }

    public static async removeFollower(acceptedLanguages: Array<string>, userId: string, payload: UserRemoveFollowerDTO): Promise<boolean> {

        const unfollow = await FollowEntity.findOneAndUpdate({ _id: payload.followId, followingId: userId }, { recordStatus: RecordStatus.Deleted });
        if (!unfollow)
            throw new NotValidError(getMessage("noUserToRemoveFollow", acceptedLanguages));

        return true;
    }

    public static async getFollowRequestsFromMe(acceptedLanguages: Array<string>, userId: string, payload: BaseFilter): Promise<FollowRequestDocument[]> {

        let followRequestsQuery = FollowRequestEntity.find({ ownerId: userId }, { "ownerId": 0 })

        if (payload.lastRecordDate)
            followRequestsQuery = followRequestsQuery.where({ createdAt: { $lt: payload.lastRecordDate } });

        const followRequests = await followRequestsQuery.sort({ createdAt: -1 })
            .limit(payload.take)
            .lean(true);

        if (followRequests.length > 0) {
            const followReqRequestedUserIds = followRequests.map(x => x.requestedId);
            const requiredUsers = await UserEntity.find({ _id: { $in: followReqRequestedUserIds } }, ["profilePhotoUrl", "username", "firstName", "lastName", "avatarKey"]);
            for (let i = 0; i < followRequests.length; i++) {
                const followReq = followRequests[i];
                followReq.requestedUser = requiredUsers.find(x => x.id == followReq.requestedId);
            }
        }
        return followRequests;
    }

    public static async getFollowRequestsToMe(acceptedLanguages: Array<string>, userId: string, payload: BaseFilter): Promise<FollowRequestDocument[]> {

        let followRequestsQuery = FollowRequestEntity.find({ requestedId: userId }, { "requestedId": 0 })

        if (payload.lastRecordDate)
            followRequestsQuery = followRequestsQuery.where({ createdAt: { $lt: payload.lastRecordDate } });

        const followRequests = await followRequestsQuery
            .sort({ createdAt: -1 })
            .limit(payload.take)
            .lean(true);

        if (followRequests.length > 0) {
            const followReqRequestedUserIds = followRequests.map(x => x.ownerId);
            const requiredUsers = await UserEntity.find({ _id: { $in: followReqRequestedUserIds } }, ["profilePhotoUrl", "username", "firstName", "lastName", "avatarKey"]);
            for (let i = 0; i < followRequests.length; i++) {
                const followReq = followRequests[i];
                followReq.ownerUser = requiredUsers.find(x => x.id == followReq.ownerId);
            }
        }
        return followRequests;
    }

    public static async getFollowers(acceptedLanguages: Array<string>, userId: string, payload: BaseFilter): Promise<FollowDocument[]> {

        let followersQuery = FollowEntity.find({ followingId: userId }, { "followingId": 0 })

        if (payload.lastRecordDate)
            followersQuery = followersQuery.where({ createdAt: { $lt: payload.lastRecordDate } });

        const followers = await followersQuery
            .sort({ createdAt: -1 })
            .limit(payload.take)
            .lean(true);

        if (followers.length > 0) {
            const followerUserIds = followers.map(x => x.followerId);
            const requiredUsers = await UserEntity.find({ _id: { $in: followerUserIds } }, ["profilePhotoUrl", "username", "firstName", "lastName", "lastSeenDate", "avatarKey"]);
            for (let i = 0; i < followers.length; i++) {
                const follow = followers[i];
                follow.followerUser = requiredUsers.find(x => x.id == follow.followerId);
            }
        }
        return followers;
    }

    public static async getFollowing(acceptedLanguages: Array<string>, userId: string, payload: BaseFilter): Promise<FollowDocument[]> {

        let followingQuery = FollowEntity.find({ followerId: userId })

        if (payload.lastRecordDate)
            followingQuery = followingQuery.where({ createdAt: { $lt: payload.lastRecordDate } });

        const following = await followingQuery
            .sort({ createdAt: -1 })
            .limit(payload.take)
            .lean(true);

        if (following.length > 0) {
            const followingUserIds = following.map(x => x.followingId);
            const requiredUsers = await UserEntity.find({ _id: { $in: followingUserIds } }, ["profilePhotoUrl", "username", "firstName", "lastName", "lastSeenDate", "avatarKey"]);
            for (let i = 0; i < following.length; i++) {
                const follow = following[i];
                follow.followingUser = requiredUsers.find(x => x.id == follow.followingId);
            }
        }
        return following;
    }

    public static async report(acceptedLanguages: Array<string>, userId: string, payload: ReportDTO): Promise<boolean> {
        await ReportEntity.create({ ...payload, userId: userId });
        //TODO: send notification to admin and maybe to user
        return true;
    }

    public static async getNotificationHistory(acceptedLanguages: Array<string>, userId: string, payload: BaseFilter): Promise<NotificationDocument[]> {
        let notificationHistoryQuery = NotificationEntity.find({ ownerId: userId })

        if (payload.lastRecordDate)
            notificationHistoryQuery = notificationHistoryQuery.where({ createdAt: { $lt: payload.lastRecordDate } });

        const notificationHistory = await notificationHistoryQuery
            .sort({ createdAt: -1 })
            .limit(payload.take)
            .lean(true);

        if (notificationHistory.length > 0) {
            const notificationHistoryUserIds = notificationHistory.filter(x => x.relatedUserId).map(x => x.relatedUserId);
            const requiredUsers = await UserEntity.find({ _id: { $in: notificationHistoryUserIds } }, ["profilePhotoUrl", "username", "firstName", "lastName", "avatarKey"]).lean(true);
            const notificationHistoryGroupChatIds = notificationHistory.filter(x => x.groupChatId).map(x => x.groupChatId);
            const requiredGroupChats = await GroupChatEntity.find({ _id: { $in: notificationHistoryGroupChatIds } }, { title: 1 }).lean(true);
            for (let i = 0; i < notificationHistory.length; i++) {
                const notification = notificationHistory[i];
                notification.relatedUser = requiredUsers.find(x => x._id.toString() == notification.relatedUserId);
                notification.groupChat = requiredGroupChats.find(x => x._id.toString() == notification.groupChatId);
            }
        }
        return notificationHistory;
    }

    public static async removeNotification(acceptedLanguages: Array<string>, userId: string, notificationId: string): Promise<boolean> {
        const notificationDelete = await NotificationEntity.findOneAndUpdate({ _id: notificationId, ownerId: userId }, { recordStatus: RecordStatus.Deleted });

        if (!notificationDelete)
            throw new NotValidError(getMessage("xNotFound", acceptedLanguages, ["Bildirim"]));
        return true;
    }

    public static async notifyReadNotifications(acceptedLanguages: Array<string>, userId: string, payload: NotificationsReadedDTO): Promise<boolean> {
        const notificationsReaded = await NotificationEntity.updateMany({ _id: { $in: payload.notificationIds }, ownerId: userId }, { readed: true });

        if (!notificationsReaded)
            throw new NotValidError(getMessage("unknownError", acceptedLanguages));
        return true;
    }
}