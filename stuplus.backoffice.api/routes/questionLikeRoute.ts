import { Router } from "express"
import { QuestionEntity, QuestionLikeEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateQuestionLikeDTO, QuestionLikeListDTO } from "../dtos/questionLike";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";
import RedisService from "../../stuplus-lib/services/redisService";

const router = Router();

router.get("/list", authorize([Role.Admin]), async (req: CustomRequest<QuestionLikeListDTO>, res: any) => {
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

    let temp = QuestionLikeEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { type: { $regex: search, $options: "i" } },
      ]);
    }
    let questionLikes = await temp;
    const total = await QuestionLikeEntity.countDocuments();
    const ownerIds = questionLikes.map(questionLike => questionLike.ownerId);
    const owners = await UserEntity.find({ _id: { $in: ownerIds } }, ["_id", "username"], { lean: true });
    const questionIds = questionLikes.map(questionLike => questionLike.questionId);
    const questions = await QuestionEntity.find({ _id: { $in: questionIds } }, ["_id", "title"], { lean: true });
    response.data = { items: questionLikes, owners: owners, questions: questions, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.post("/addUpdateQuestionLike", authorize([Role.Admin]), async (req: CustomRequest<AddUpdateQuestionLikeDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const questionLike = new AddUpdateQuestionLikeDTO(req.body);
    if (questionLike._id) {
      const questionLikeToUpdate = await QuestionLikeEntity.findById(questionLike._id);
      if (!questionLikeToUpdate) {
        response.setErrorMessage("QuestionLike not found");
        throw new NotValidError("QuestionLike not found", 404);
      }
      questionLikeToUpdate.ownerId = questionLike.ownerId;
      questionLikeToUpdate.questionId = questionLike.questionId;
      questionLikeToUpdate.type = questionLike.type;

      await questionLikeToUpdate.save();
    }
    else {
      if (await QuestionLikeEntity.findOne({ ownerId: questionLike.ownerId, questionId: questionLike.questionId }))
        throw new NotValidError("This user already liked/dislike this question");
      const newQuestionLike = new QuestionLikeEntity(questionLike);
      await newQuestionLike.save();
    }
  } catch (err: any) {
    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.delete("/deleteQuestionLike", authorize([Role.Admin]), async (req: CustomRequest<QuestionLikeListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const questionLike = await QuestionLikeEntity.findOne({ _id: req.body._id });
    if (!questionLike) {
      throw new NotValidError("QuestionLike not found", 404);
    }
    questionLike.recordStatus = RecordStatus.Deleted;

    await questionLike.save();
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

export default router;
