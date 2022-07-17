import { Router } from "express"
import { QuestionEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateQuestionDTO, QuestionListDTO } from "../dtos/question";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";
import RedisService from "../../stuplus-lib/services/redisService";

const router = Router();

router.get("/list", authorize([Role.Admin]), async (req: CustomRequest<QuestionListDTO>, res: any) => {
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

    let temp = QuestionEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { username: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ]);
    }
    let questions = await temp;
    const total = await QuestionEntity.countDocuments();
    const ownerIds = questions.map(question => question.ownerId);
    const owners = await UserEntity.find({ _id: { $in: ownerIds } }, ["_id", "username"], { lean: true });
    response.data = { items: questions, owners: owners, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/addUpdatequestion", authorize([Role.Admin]), async (req: CustomRequest<AddUpdateQuestionDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const question = new AddUpdateQuestionDTO(req.body);
    if (question._id) {
      const questionToUpdate = await QuestionEntity.findById(question._id);
      if (!questionToUpdate) {
        response.setErrorMessage("question not found");
        throw new NotValidError("question not found", 404);
      }
      questionToUpdate.ownerId = question.ownerId;
      questionToUpdate.title = question.title;
      questionToUpdate.coverImageUrl = question.coverImageUrl;
      questionToUpdate.relatedSchoolIds = question.relatedSchoolIds;
      questionToUpdate.text = question.text;
      questionToUpdate.isActive = question.isActive;
      questionToUpdate.fromDate = question.fromDate;
      questionToUpdate.toDate = question.toDate;
      await questionToUpdate.save();
    }
    else {
      const newquestion = new QuestionEntity(question);
      await newquestion.save();
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.delete("/deletequestion", authorize([Role.Admin]), async (req: CustomRequest<QuestionListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const question = await QuestionEntity.findOne({ _id: req.body._id });
    if (!question) {
      throw new NotValidError("question not found", 404);
    }
    question.recordStatus = RecordStatus.Deleted;

    await question.save();
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

export default router;
