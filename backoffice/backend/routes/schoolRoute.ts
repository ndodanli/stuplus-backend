import { Router } from "express"
import { UserAccess } from "../../../api/dataAccess/userAccess";
import { LoginUserDTO } from "../../../api/dtos/UserDTOs";
import { validateLogin } from "../../../api/middlewares/validation/login/validateLoginRoute";
import { SchoolEntity, UserEntity } from "../../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../../stuplus-lib/localization/responseMessages";
import { CustomRequest } from "../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../../stuplus-lib/utils/base/ResponseObjectResults";
import bcrypt from "bcryptjs"
import { getNewToken } from "../utils/token";
import { AddUpdateSchoolDTO, SchoolListDTO } from "../dtos/school";
import { authorize } from "../middlewares/auth";
import { Role } from "../../../stuplus-lib/enums/enums";
import { uploadSingleFileS3 } from "../../../stuplus-lib/services/fileService";
import { SortOrder } from "mongoose";

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
    const schools = await SchoolEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
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

export default router;
