import { Router } from "express"
import { DepartmentEntity, FacultyEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateDepartmentDTO, DepartmentListDTO } from "../dtos/department";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";
import RedisService from "../../stuplus-lib/services/redisService";

const router = Router();

router.get("/list", authorize([Role.Admin]), async (req: CustomRequest<DepartmentListDTO>, res: any) => {
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

    let temp = DepartmentEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { title: { $regex: search, $options: "i" } },
        { emailFormat: { $regex: search, $options: "i" } }
      ]);
    }
    let departments = await temp;
    const total = await DepartmentEntity.countDocuments();
    const facultyIds = departments.map(department => department.facultyId);
    const faculties = await FacultyEntity.find({ _id: { $in: facultyIds } }, ["_id", "title"], { lean: true });
    response.data = { items: departments, faculties: faculties, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/addUpdateDepartment", authorize([Role.Admin]), async (req: CustomRequest<AddUpdateDepartmentDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const department = new AddUpdateDepartmentDTO(req.body);
    if (department._id) {
      const departmentToUpdate = await DepartmentEntity.findOne({ _id: department._id });
      if (!departmentToUpdate) {
        response.setErrorMessage("Department not found");
        throw new NotValidError("Department not found", 404);
      }
      departmentToUpdate.facultyId = department.facultyId;
      departmentToUpdate.title = department.title;
      departmentToUpdate.coverImageUrl = department.coverImageUrl;
      departmentToUpdate.grade = department.grade;
      await departmentToUpdate.save();
    }
    else {
      const newDepartment = new DepartmentEntity(department);
      await newDepartment.save();
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.delete("/deleteDepartment", authorize([Role.Admin]), async (req: CustomRequest<DepartmentListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const department = await DepartmentEntity.findOne({ _id: req.body._id });
    if (!department) {
      throw new NotValidError("Department not found", 404);
    }
    department.recordStatus = RecordStatus.Deleted;

    const bulkUserUpdateOps = [];
    const usersWhoRelatedToDepartment = await UserEntity.find({ departmentId: department._id });
    for (let user of usersWhoRelatedToDepartment) {
      user.departmentId = null;
      bulkUserUpdateOps.push({
        updateOne: {
          filter: {
            _id: user._id.toString()
          },
          update: {
            departmentId: user.departmentId,
          }
        }
      })
    }
    await department.save();
    for (let user of usersWhoRelatedToDepartment) {
      await RedisService.updateUser(user)
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

export default router;
