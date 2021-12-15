import { Router } from "express";
import BaseResponse from "../utils/base/BaseResponse";
import { InternalError, Ok } from "../utils/base/ResponseObjectResults";
import { CustomRequest } from "../utils/base/baseOrganizers";
import { InterestAccess } from "../dataAccess/interestAccess";
const router = Router();

router.get("/getAllInterests", async (req: CustomRequest<object>, res: any) => {
    const response = new BaseResponse<object>();
    try {
        response.data = await InterestAccess.getAllInterests(["_id", "url", "title"]);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response);
});

export default router;
