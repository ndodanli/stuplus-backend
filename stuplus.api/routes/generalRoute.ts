import { Router } from "express";
import logger from "../../stuplus-lib/config/logger";
import { ImageStatisticEntity } from "../../stuplus-lib/entities/BaseEntity";
import { ImageFiles } from "../../stuplus-lib/entities/QuestionEntity";
import { Role } from "../../stuplus-lib/enums/enums";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { uploadFileS3 } from "../../stuplus-lib/services/fileService";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { stringify } from "../../stuplus-lib/utils/general";
import { UploadImagesDTO } from "../dtos/GeneralDTOs";
import { authorize } from "../middlewares/auth";
import { validateUploadImages } from "../middlewares/validation/general/validateGeneralRoute";

const router = Router();

router.post("/updateImageStats", async (req: CustomRequest<any>, res: any) => {
  try {
    const payload = req.body;
    if (payload.token != "spp8sumi2n7mv8f")
      throw new Error("Invalid token");

    for (let i = 0; i < payload.stats.length; i++) {
      const stat = payload.stats[i];
      await ImageStatisticEntity.findOneAndUpdate({
        host: stat.host
      }, {
        totalMasterImage: stat.totalMasterImage,
        totalTransformation: stat.totalTransformation,
        totalSize: stat.totalSize,
        totalBandwidth: stat.totalBandwidth,
        totalView: stat.totalView
      }, {
        upsert: true
      });
    }

  } catch (err: any) {
    logger.error({ err: err }, `notifyReadNotifications failed. {Data}`, stringify({ ErorMessage: err.message }));
  }

  return res.status(200).send();
});

router.post("/uploadImages", authorize([Role.Admin, Role.ContentCreator, Role.User, Role.GroupGuard]), uploadFileS3.array("images", [".png", ".jpg", ".jpeg", ".svg", ".webp"], null), validateUploadImages, async (req: CustomRequest<UploadImagesDTO>, res: any) => {
  /* #swagger.tags = ['General']
       #swagger.description = 'Upload images(for Announcements and Questions)' */
  /*	#swagger.requestBody = {
 required: true,
"@content": {
               "multipart/form-data": {
                   schema: {
                       type: "object",
                       properties: {
                           isCompressed: {
                               type: "boolean",
                           },
                           uploadPath: {
                               type: "string",
                           },
                          images: {
                              type: "array",
                              items: {
                                  type: "string",
                                  format: "binary"
                              }
                          }
                       },
                       required: ["isCompressed", "images", "uploadPath"]
                   }
               }
           } 
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/GeneralUploadImagesResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    if (req.fileValidationErrors?.length) {
      response.validationErrors = req.fileValidationErrors;
      throw new NotValidError(getMessage("fileError", req.selectedLangs()))
    }

    if (!req.files || req.files.length == 0 || !Array.isArray(req.files))
      throw new NotValidError(getMessage("fileError", req.selectedLangs()))

    response.data = req.files.map((file) => new ImageFiles(file.location, file.mimetype, file.size, req.body.isCompressed == "true"));

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response);
})

export default router;
