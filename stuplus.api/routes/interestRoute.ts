import { Router } from "express";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { InterestAccess } from "../dataAccess/interestAccess";
const router = Router();

router.get("/getAllInterests", async (req: CustomRequest<object>, res: any) => {
    /* #swagger.tags = ['Interest']
#swagger.description = 'Get all interests' */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/InterestGetAllInterestsResponse"
     }
   } */
    const response = new BaseResponse<object>();
    try {
        response.data = await InterestAccess.getAllInterests(["_id", "url", "title", "icon"]);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

export default router;
