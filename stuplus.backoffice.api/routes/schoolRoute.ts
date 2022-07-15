import { Router } from "express"
import { DepartmentEntity, FacultyEntity, GroupChatEntity, GroupChatUserEntity, SchoolEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateSchoolDTO, SchoolListDTO } from "../dtos/school";
import { authorize } from "../middlewares/auth";
import { GroupChatUserRole, RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";
import RedisService from "../../stuplus-lib/services/redisService";
import { GroupChatType } from "../../stuplus-lib/enums/enums_socket";
import { searchables } from "../../stuplus-lib/utils/general";

const router = Router();

router.get("/list", authorize([Role.Admin]), async (req: CustomRequest<SchoolListDTO>, res: any) => {
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

    let temp = SchoolEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { title: { $regex: search, $options: "i" } },
        { emailFormat: { $regex: search, $options: "i" } }
      ]);
    }
    let schools = await temp;
    const total = await SchoolEntity.countDocuments();
    response.data = { items: schools, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.post("/addUpdateSchool", authorize([Role.Admin]), async (req: CustomRequest<AddUpdateSchoolDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const school = new AddUpdateSchoolDTO(req.body);
    if (school._id) {
      const schoolToUpdate = await SchoolEntity.findById(school._id);
      if (!schoolToUpdate) {
        response.setErrorMessage("School not found");
        throw new NotValidError("School not found", 404);
      }
      schoolToUpdate.title = school.title;
      schoolToUpdate.emailFormat = school.emailFormat;
      schoolToUpdate.coverImageUrl = school.coverImageUrl;
      schoolToUpdate.type = school.type;

      await schoolToUpdate.save();
    }
    else {
      const newSchool = new SchoolEntity(school);
      //#region Create groups
      const groupGuard = await RedisService.acquireUser("62ab8a204166fd1eaebbb3fa")

      const schoolHashtags = searchables(newSchool.title);
      const groupChatEntity = new GroupChatEntity({
        schoolId: newSchool._id.toString(),
        title: newSchool.title,
        // about: newSchool.about,
        about: "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
        coverImageUrl: newSchool.coverImageUrl,
        avatarKey: newSchool.avatarKey,
        type: GroupChatType.Public,
        ownerId: groupGuard._id.toString(),
        hashTags: schoolHashtags
      });

      await GroupChatEntity.create(groupChatEntity);

      await GroupChatUserEntity.create({
        groupChatId: groupChatEntity._id.toString(),
        userId: groupGuard._id.toString(),
        groupRole: GroupChatUserRole.Guard
      });

      if (school.departments) {
        for (let i = 0; i < school.departments.length; i++) {
          const department = school.departments[i];
          department.schoolId = newSchool._id.toString();
          const departmentEntity = new DepartmentEntity(department);
          await DepartmentEntity.create(departmentEntity);

          //#region Create department group chat
          const departmentGroupChatEntity = new GroupChatEntity({
            schoolId: newSchool._id.toString(),
            departmentId: departmentEntity._id.toString(),
            title: departmentEntity.title,
            about: departmentEntity.about,
            coverImageUrl: departmentEntity.coverImageUrl,
            avatarKey: departmentEntity.avatarKey,
            type: GroupChatType.Public,
            ownerId: groupGuard._id.toString(),
            hashTags: searchables(departmentEntity.title).concat(schoolHashtags)
          });

          await GroupChatEntity.create(departmentGroupChatEntity);

          await GroupChatUserEntity.create({
            groupChatId: departmentGroupChatEntity._id.toString(),
            userId: groupGuard._id.toString(),
            groupRole: GroupChatUserRole.Guard
          });

          //#endregion

          //#region Create department grade group chats
          for (let j = 1; j <= department.grade; j++) {
            const departmentGradeGroupChatEntity = new GroupChatEntity({
              schoolId: newSchool._id.toString(),
              departmentId: departmentEntity._id.toString(),
              title: departmentEntity.title + ` ${j}. Sınıf`,
              about: departmentEntity.about,
              coverImageUrl: departmentEntity.coverImageUrl,
              avatarKey: departmentEntity.avatarKey,
              grade: j,
              type: GroupChatType.Public,
              ownerId: groupGuard._id.toString(),
              hashTags: searchables(departmentEntity.title + ` ${j}. Sınıf`).concat(schoolHashtags),
              secondaryEducation: false
            });
            await GroupChatEntity.create(departmentGradeGroupChatEntity);

            await GroupChatUserEntity.create({
              groupChatId: departmentGradeGroupChatEntity._id.toString(),
              userId: groupGuard._id.toString(),
              groupRole: GroupChatUserRole.Guard
            });
            if (department.secondaryEducation) {
              const depSecondaryEducationGroupChatEntity = new GroupChatEntity({
                schoolId: newSchool._id.toString(),
                departmentId: departmentEntity._id.toString(),
                title: departmentEntity.title + ` ${j}. Sınıf İÖ`,
                about: departmentEntity.about,
                coverImageUrl: departmentEntity.coverImageUrl,
                avatarKey: departmentEntity.avatarKey,
                grade: j,
                type: GroupChatType.Public,
                ownerId: groupGuard._id.toString(),
                hashTags: searchables(departmentEntity.title + ` ${j}. Sınıf İÖ`).concat(schoolHashtags),
                secondaryEducation: true
              });
              await GroupChatEntity.create(depSecondaryEducationGroupChatEntity);

              await GroupChatUserEntity.create({
                groupChatId: depSecondaryEducationGroupChatEntity._id.toString(),
                userId: groupGuard._id.toString(),
                groupRole: GroupChatUserRole.Guard
              });
            }
          }
          if (department.preparation) {
            const departmentGradeGroupChatEntity = new GroupChatEntity({
              schoolId: newSchool._id.toString(),
              departmentId: departmentEntity._id.toString(),
              title: departmentEntity.title + " Hazırlık",
              about: departmentEntity.about,
              coverImageUrl: departmentEntity.coverImageUrl,
              avatarKey: departmentEntity.avatarKey,
              grade: 0,
              type: GroupChatType.Public,
              ownerId: groupGuard._id.toString(),
              hashTags: searchables(departmentEntity.title + " Hazırlık").concat(schoolHashtags)
            });
            await GroupChatEntity.create(departmentGradeGroupChatEntity);

            await GroupChatUserEntity.create({
              groupChatId: departmentGradeGroupChatEntity._id.toString(),
              userId: groupGuard._id.toString(),
              groupRole: GroupChatUserRole.Guard
            });
          }
          //#endregion
        }
      }
      //#endregion
      await newSchool.save();
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  await RedisService.updateSchools();

  return Ok(res, response)
});

router.delete("/deleteSchool", authorize([Role.Admin]), async (req: CustomRequest<SchoolListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const school = await SchoolEntity.findOne({ _id: req.body._id });
    if (!school) {
      throw new NotValidError("School not found", 404);
    }
    school.recordStatus = RecordStatus.Deleted;

    const bulkUserUpdateOps = [];
    const usersWhoRelatedToSchool = await UserEntity.find({})
      .or([
        { schoolId: school._id },
        { relatedSchoolIds: { $in: [school._id] } }
      ]);
    for (let user of usersWhoRelatedToSchool) {
      user.schoolId = null;
      user.relatedSchoolIds = user.relatedSchoolIds.filter(id => id != school._id.toString());
      bulkUserUpdateOps.push({
        updateOne: {
          filter: {
            _id: user._id.toString()
          },
          update: {
            schoolId: user.schoolId,
            relatedSchoolIds: user.relatedSchoolIds
          }
        }
      })
    }
    await UserEntity.bulkWrite(bulkUserUpdateOps);
    await DepartmentEntity.updateMany({ schoolId: school._id }, { recordStatus: RecordStatus.Deleted });
    await FacultyEntity.updateMany({ schoolId: school._id }, { recordStatus: RecordStatus.Deleted });
    await GroupChatEntity.updateMany({ schoolId: school._id }, { recordStatus: RecordStatus.Deleted });
    await school.save();
    for (let user of usersWhoRelatedToSchool) {
      await RedisService.updateUser(user)
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  await RedisService.updateSchools();

  return Ok(res, response)
});

export default router;
