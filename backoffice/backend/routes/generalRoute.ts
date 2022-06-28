import { Router } from "express"
import NotValidError from "../../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../../stuplus-lib/localization/responseMessages";
import { CustomRequest } from "../../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../../stuplus-lib/utils/base/ResponseObjectResults";
import { authorize } from "../middlewares/auth";
import { Role } from "../../../stuplus-lib/enums/enums";
import { uploadSingleFileS3 } from "../../../stuplus-lib/services/fileService";

const router = Router();

router.post("/uploadFile", authorize([Role.Admin]), uploadSingleFileS3.single("file", [], null, 5242880), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    if (req.fileValidationErrors?.length) {
      response.validationErrors = req.fileValidationErrors;
      throw new NotValidError(getMessage("fileError", req.selectedLangs()))
    }

    response.data = { url: req.file?.location }

    response.setMessage("File uploaded successfully");

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
})

export default router;
