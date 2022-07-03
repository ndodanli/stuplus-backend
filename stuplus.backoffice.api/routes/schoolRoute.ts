import { Router } from "express"
import { SchoolEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateSchoolDTO, SchoolListDTO } from "../dtos/school";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";
import RedisService from "../../stuplus-lib/services/redisService";

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
      await schoolToUpdate.save();
    }
    else {
      const newSchool = new SchoolEntity(school);
      await newSchool.save();
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

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
    await school.save();
    for (let user of usersWhoRelatedToSchool) {
      RedisService.updateUser(user)
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

export default router;
