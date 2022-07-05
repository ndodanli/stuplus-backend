import { Router } from "express"
import { QuestionEntity, QuestionCommentEntity, UserEntity, QuestionCommentLikeEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateQuestionCommentDTO, QuestionCommentListDTO } from "../dtos/questionComment";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";

const router = Router();

router.get("/list", authorize([Role.Admin]), async (req: CustomRequest<QuestionCommentListDTO>, res: any) => {
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

    let temp = QuestionCommentEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { comment: { $regex: search, $options: "i" } },
      ]);
    }
    let questionComments = await temp;
    const total = await QuestionCommentEntity.countDocuments();
    const ownerIds = questionComments.map(QuestionComment => QuestionComment.ownerId);
    const owners = await UserEntity.find({ _id: { $in: ownerIds } }, ["_id", "username"], { lean: true });
    const questionIds = questionComments.map(QuestionComment => QuestionComment.questionId);
    const questions = await QuestionEntity.find({ _id: { $in: questionIds } }, ["_id", "title"], { lean: true });
    response.data = { items: questionComments, owners: owners, questions: questions, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.post("/addUpdateQuestionComment", authorize([Role.Admin]), async (req: CustomRequest<AddUpdateQuestionCommentDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const questionComment = new AddUpdateQuestionCommentDTO(req.body);
    if (questionComment._id) {
      const questionCommentToUpdate = await QuestionCommentEntity.findById(questionComment._id);
      if (!questionCommentToUpdate) {
        response.setErrorMessage("QuestionComment not found");
        throw new NotValidError("QuestionComment not found", 404);
      }
      questionCommentToUpdate.ownerId = questionComment.ownerId;
      questionCommentToUpdate.questionId = questionComment.questionId;
      questionCommentToUpdate.comment = questionComment.comment;

      await questionCommentToUpdate.save();
    }
    else {
      const newQuestionComment = new QuestionCommentEntity(questionComment);
      await newQuestionComment.save();
    }
  } catch (err: any) {
    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.delete("/deleteQuestionComment", authorize([Role.Admin]), async (req: CustomRequest<QuestionCommentListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const questionComment = await QuestionCommentEntity.findOne({ _id: req.body._id });
    if (!questionComment) {
      throw new NotValidError("Question not found");
    }
    questionComment.recordStatus = RecordStatus.Deleted;

    await QuestionCommentLikeEntity.updateMany(
      { commentId: questionComment._id },
      { recordStatus: RecordStatus.Deleted }
    );
    await questionComment.save();
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

export default router;
