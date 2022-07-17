import { Router } from "express"
import { QuestionCommentLikeEntity, UserEntity, QuestionCommentEntity, QuestionEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateQuestionCommentLikeDTO, QuestionCommentLikeListDTO } from "../dtos/questionCommentLike";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";

const router = Router();

router.get("/list", authorize([Role.Admin]), async (req: CustomRequest<QuestionCommentLikeListDTO>, res: any) => {
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

    let temp = QuestionCommentLikeEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { comment: { $regex: search, $options: "i" } },
      ]);
    }
    let questionCommentLikes = await temp;
    const total = await QuestionCommentLikeEntity.countDocuments();
    const ownerIds = questionCommentLikes.map(questionCommentLike => questionCommentLike.ownerId);
    const owners = await UserEntity.find({ _id: { $in: ownerIds } }, ["_id", "username"], { lean: true });
    const commentIds = questionCommentLikes.map(questionCommentLike => questionCommentLike.commentId);
    const comments = await QuestionCommentEntity.find({ _id: { $in: commentIds } }, ["_id", "comment"], { lean: true });
    const questionIds = questionCommentLikes.map(questionCommentLike => questionCommentLike.questionId);
    const questions = await QuestionEntity.find({ _id: { $in: questionIds } }, ["_id", "title"], { lean: true });
    response.data = { items: questionCommentLikes, owners: owners, questions: questions, comments: comments, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/addUpdateQuestionCommentLike", authorize([Role.Admin]), async (req: CustomRequest<AddUpdateQuestionCommentLikeDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const questionCommentLike = new AddUpdateQuestionCommentLikeDTO(req.body);
    if (questionCommentLike._id) {
      const questionCommentLikeToUpdate = await QuestionCommentLikeEntity.findById(questionCommentLike._id);
      if (!questionCommentLikeToUpdate) {
        response.setErrorMessage("QuestionCommentLike not found");
        throw new NotValidError("QuestionCommentLike not found", 404);
      }
      questionCommentLikeToUpdate.ownerId = questionCommentLike.ownerId;
      questionCommentLikeToUpdate.commentId = questionCommentLike.commentId;
      questionCommentLikeToUpdate.type = questionCommentLike.type;

      await questionCommentLikeToUpdate.save();
    }
    else {
      if (await QuestionCommentLikeEntity.findOne({ ownerId: questionCommentLike.ownerId, commentId: questionCommentLike.commentId }))
        throw new NotValidError("This user already liked/dislike this question");
      const newQuestionCommentLike = new QuestionCommentLikeEntity(questionCommentLike);
      await newQuestionCommentLike.save();
    }
  } catch (err: any) {
    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.delete("/deleteQuestionCommentLike", authorize([Role.Admin]), async (req: CustomRequest<QuestionCommentLikeListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const questionCommentLike = await QuestionCommentLikeEntity.findOne({ _id: req.body._id });
    if (!questionCommentLike) {
      throw new NotValidError("QuestionCommentLike not found", 404);
    }
    questionCommentLike.recordStatus = RecordStatus.Deleted;

    await questionCommentLike.save();
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

export default router;
