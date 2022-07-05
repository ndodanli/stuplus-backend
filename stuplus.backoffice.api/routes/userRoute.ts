import { Router } from "express"
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateUserDTO, UserListDTO } from "../dtos/user";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";
import { UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import bcrypt from "bcryptjs"
import RedisService from "../../stuplus-lib/services/redisService";

const router = Router();

router.get("/list", authorize([Role.Admin]), async (req: CustomRequest<UserListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    let limit = parseInt(req.query.pageSize as string);
    let skip = (parseInt(req.query.page as string) - 1) * limit;
    let sort = req.query.sort as string;
    let sortOrder: SortOrder = sort.slice(0, 1) === "+" ? 1 : -1;
    let sortBy = sort.slice(1);
    let sortFilter = {
      [sortBy]: sortOrder
    }
    let search = req.query.search as string;
    if (search) {
      search = search.toLowerCase();
    }

    let temp = UserEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { username: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ]);
    }
    let users = await temp;
    const blockedUserIds = users.map(user => user.blockedUserIds).reduce((acc, curr) => acc.concat(curr), []);

    const blockedUsers = await UserEntity.find({
      blockedUserIds: { $in: blockedUserIds }
    });
    const total = await UserEntity.countDocuments();
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      user.password = "";

    }
    response.data = { items: users, blockedUsers: blockedUsers, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.post("/addUpdateUser", authorize([Role.Admin]), async (req: CustomRequest<AddUpdateUserDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const user = new AddUpdateUserDTO(req.body);
    if (user._id) {
      const userToUpdate = await UserEntity.findById(user._id);
      if (!userToUpdate) {
        response.setErrorMessage("User not found");
        throw new NotValidError("User not found", 404);
      }

      userToUpdate.email = user.email;
      if (user.password)
        userToUpdate.password = await bcrypt.hash(user.password, 10)
      if (user.username != userToUpdate.username) {
        if (await UserEntity.findOne({ username: user.username }, { "_id": 0, "username": 1 }, { lean: true })) {
          throw new NotValidError("Username already exists");
        }
        userToUpdate.username = user.username;
      }

      userToUpdate.role = user.role;
      userToUpdate.schoolEmail = user.schoolEmail;
      userToUpdate.firstName = user.firstName;
      userToUpdate.lastName = user.lastName;
      userToUpdate.schoolId = user.schoolId;
      userToUpdate.departmentId = user.departmentId;
      userToUpdate.isAccEmailConfirmed = user.isAccEmailConfirmed;
      userToUpdate.isSchoolEmailConfirmed = user.isSchoolEmailConfirmed;
      userToUpdate.grade = user.grade;
      userToUpdate.profilePhotoUrl = user.profilePhotoUrl;
      userToUpdate.gender = user.gender;
      userToUpdate.notificationSettings = user.notificationSettings;
      userToUpdate.blockedUserIds = user.blockedUserIds;
      userToUpdate.interestIds = user.interestIds;
      userToUpdate.relatedSchoolIds = user.relatedSchoolIds;
      userToUpdate.avatarKey = user.avatarKey;
      userToUpdate.about = user.about;
      userToUpdate.privacySettings = user.privacySettings;
      await userToUpdate.save();
      await RedisService.updateUser(userToUpdate);
    }
    else {
      const newUser = new UserEntity(user);
      let counter = 0;
      let username = newUser.email.split("@")[0];
      let userWithSearchedUsername = await UserEntity.findOne({ username: username }, { "_id": 0, "username": 1 }, { lean: true });
      while (userWithSearchedUsername) {
        username = newUser.email.split("@")[0] + counter;
        userWithSearchedUsername = await UserEntity.findOne({ username: username }, { "_id": 0, "username": 1 }, { lean: true });
        counter++;
      }
      newUser.username = username;
      await newUser.save();
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.delete("/deleteUser", authorize([Role.Admin]), async (req: CustomRequest<UserListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const user = await UserEntity.findOne({ _id: req.body._id });
    if (!user) {
      throw new NotValidError("User not found", 404);
    }
    user.recordStatus = RecordStatus.Deleted;

    await user.save();
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

export default router;
