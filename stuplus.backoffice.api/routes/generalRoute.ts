import { Router } from "express"
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { authorize } from "../middlewares/auth";
import { Role } from "../../stuplus-lib/enums/enums";
import { uploadSingleFileS3 } from "../../stuplus-lib/services/fileService";
import RedisService from "../../stuplus-lib/services/redisService";
import { SchoolDocument } from "../../stuplus-lib/entities/SchoolEntity";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import { AnnouncementCommentEntity, AnnouncementEntity, DepartmentEntity, FacultyEntity, InterestEntity, QuestionCommentEntity, QuestionEntity, SchoolEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";

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

router.get("/getAllSchools", authorize([Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    response.data = await RedisService.acquire<SchoolDocument[]>(RedisKeyType.Schools, 60 * 60 * 2, async () => await SchoolEntity.find({}, {}, { lean: true }));

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getAllFaculties", authorize([Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    response.data = await FacultyEntity.find({}, {}, { lean: true })

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getAllDepartments", authorize([Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    response.data = await DepartmentEntity.find({}, {}, { lean: true })

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getAllInterests", authorize([Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    response.data = await InterestEntity.find({}, {}, { lean: true })

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getUsers", authorize([Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    let search = req.query.search as string;
    if (search) {
      search = search.toLowerCase();
    }

    let temp = UserEntity.find({}, ["_id", "username"], { lean: true })
    if (search) {
      temp.or([
        { username: { $regex: search, $options: "i" } },
      ]);
    }
    response.data = await temp;

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getAnnouncements", authorize([Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    let search = req.query.search as string;
    if (search) {
      search = search.toLowerCase();
    }

    let temp = AnnouncementEntity.find({}, ["_id", "title"], { lean: true })
    if (search) {
      temp.or([
        { title: { $regex: search, $options: "i" } },
      ]);
    }
    response.data = await temp;

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getQuestions", authorize([Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    let search = req.query.search as string;
    if (search) {
      search = search.toLowerCase();
    }

    let temp = QuestionEntity.find({}, ["_id", "title"], { lean: true })
    if (search) {
      temp.or([
        { title: { $regex: search, $options: "i" } },
      ]);
    }
    response.data = await temp;

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getQuestionComments", authorize([Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {

    response.data = await QuestionCommentEntity.find({ questionId: req.query.questionId as string }, ["_id", "comment"], { lean: true })

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

router.get("/getAnnouncementComments", authorize([Role.Admin]), async (req: CustomRequest<object>, res: any) => {
  const response = new BaseResponse<object>();
  try {

    response.data = await AnnouncementCommentEntity.find({ announcementId: req.query.announcementId as string }, ["_id", "comment"], { lean: true })

  } catch (err: any) {
    response.setErrorMessage(err.message);

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response);
});

export default router;
