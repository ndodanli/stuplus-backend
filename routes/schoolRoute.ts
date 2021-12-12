import { Router } from "express";
import BaseResponse from "../utils/base/BaseResponse";
import { InternalError, Ok } from "../utils/base/ResponseObjectResults";
import { validategetFaculties, validategetDepartments } from "../middlewares/validation/school/validateSchoolRoute";
import { SchoolAccess } from "../dataAccess/schoolAccess";
import { CustomRequest } from "../utils/base/baseOrganizers";
const router = Router();

router.get("/getAllSchools", async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    response.data = await SchoolAccess.getAllSchools(["_id", "title"]);

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getFaculties/:schoolId", validategetFaculties, async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    response.data = await SchoolAccess.getFaculties(req.params.schoolId, ["_id", "title","schoolId"]);

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getDepartments/:facultyId", validategetDepartments, async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    response.data = await SchoolAccess.getDepartments(req.params.facultyId, ["_id", "title","facultyId","grade"]);

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

export default router;
