import { Router } from "express"
import { DepartmentEntity, FacultyEntity, SchoolEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateFacultyDTO, FacultyListDTO } from "../dtos/faculty";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";
import RedisService from "../../stuplus-lib/services/redisService";

const router = Router();

router.get("/list", authorize([Role.Admin]), async (req: CustomRequest<FacultyListDTO>, res: any) => {
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

    let temp = FacultyEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { title: { $regex: search, $options: "i" } },
        { emailFormat: { $regex: search, $options: "i" } }
      ]);
    }
    let faculties = await temp;
    const total = await FacultyEntity.countDocuments();
    const schoolIds = faculties.map(faculty => faculty.schoolId);
    const schools = await SchoolEntity.find({ _id: { $in: schoolIds } }, ["_id", "title"], { lean: true });
    response.data = { items: faculties, schools: schools, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.post("/addUpdateFaculty", authorize([Role.Admin]), async (req: CustomRequest<AddUpdateFacultyDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const faculty = new AddUpdateFacultyDTO(req.body);
    if (faculty._id) {
      const facultyToUpdate = await FacultyEntity.findById(faculty._id);
      if (!facultyToUpdate) {
        response.setErrorMessage("Faculty not found");
        throw new NotValidError("Faculty not found", 404);
      }
      facultyToUpdate.schoolId = faculty.schoolId;
      facultyToUpdate.title = faculty.title;
      facultyToUpdate.coverImageUrl = faculty.coverImageUrl;
      await facultyToUpdate.save();
    }
    else {
      const newFaculty = new FacultyEntity(faculty);
      await newFaculty.save();
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.delete("/deleteFaculty", authorize([Role.Admin]), async (req: CustomRequest<FacultyListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const faculty = await FacultyEntity.findOne({ _id: req.body._id });
    if (!faculty) {
      throw new NotValidError("Faculty not found", 404);
    }
    faculty.recordStatus = RecordStatus.Deleted;

    const bulkUserUpdateOps = [];
    const usersWhoRelatedToFaculty = await UserEntity.find({ facultyId: faculty._id });
    for (let user of usersWhoRelatedToFaculty) {
      user.facultyId = null;
      bulkUserUpdateOps.push({
        updateOne: {
          filter: {
            _id: user._id.toString()
          },
          update: {
            facultyId: user.facultyId,
          }
        }
      })
    }
    await UserEntity.bulkWrite(bulkUserUpdateOps);
    await DepartmentEntity.updateMany({ facultyId: faculty._id }, { recordStatus: RecordStatus.Deleted });
    await faculty.save();
    for (let user of usersWhoRelatedToFaculty) {
      await RedisService.updateUser(user)
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

export default router;
