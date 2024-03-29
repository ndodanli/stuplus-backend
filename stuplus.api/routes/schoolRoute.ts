import { Router } from "express";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { validategetFaculties, validategetDepartments } from "../middlewares/validation/school/validateSchoolRoute";
import { SchoolAccess } from "../dataAccess/schoolAccess";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
const router = Router();

router.get("/getAllSchools", async (req: CustomRequest<object>, res: any) => {
  /* #swagger.tags = ['School']
#swagger.description = 'Get all schools.' */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/SchoolGetAllSchoolsResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await SchoolAccess.getAllSchools();

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response);
});

router.get("/getFaculties/:schoolId", validategetFaculties, async (req: CustomRequest<object>, res: any) => {
  /* #swagger.tags = ['School']
#swagger.description = 'Get faculties by school id' */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/SchoolGetFacultiesResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await SchoolAccess.getFaculties(req.params.schoolId, ["_id", "title", "schoolId"]);

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response);
});

router.get("/getDepartments/:schoolId", validategetDepartments, async (req: CustomRequest<object>, res: any) => {
  /* #swagger.tags = ['School']
#swagger.description = 'Get departments by school id' */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/SchoolGetDepartmentsResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await SchoolAccess.getDepartments(req.params.schoolId, ["_id", "title", "schoolId", "grade"]);

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response);
});

export default router;
