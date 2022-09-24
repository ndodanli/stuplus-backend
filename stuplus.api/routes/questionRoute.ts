import { Router } from "express"
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { validateAddQuestion, validateCommentQuestion, validateCommentLikeDislikeQuestion, validateGetQuestionsQuestion, validateGetCommentsQuestion, validateLikeDislikeQuestion, validateGetSubCommentsQuestion, validateSubCommentQuestion, validateSubCommentLikeDislikeQuestion } from "../middlewares/validation/question/validateQuestionRoute";
import { authorize } from "../middlewares/auth";
import { OSNotificationType, Role } from "../../stuplus-lib/enums/enums";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { QuestionAddDTO, QuestionCommenLikeDisliketDTO, QuestionCommentDTO, QuestionLikeDislikeDTO, QuestionGetMultipleDTO, QuestionGetCommentsDTO, QuestionGetSubCommentsDTO, QuestionSubCommentDTO, QuestionSubCommenLikeDisliketDTO } from "../dtos/QuestionDTOs";
import { QuestionAccess } from "../dataAccess/questionAccess";
import axios from "axios";
import OneSignalService from "../../stuplus-lib/services/oneSignalService";
import { QuestionCommentEntity, QuestionEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { truncate } from "../../stuplus-lib/utils/general";
const router = Router();

router.post("/add", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateAddQuestion, async (req: CustomRequest<QuestionAddDTO>, res: any) => {
  /* #swagger.tags = ['Question']
     #swagger.description = 'Add an question.' */
  /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/QuestionAddRequest" }
  } */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    const payload = new QuestionAddDTO(req.body);
    if (payload.images) {
      for (let i = 0; i < payload.images.length; i++) {
        const image = payload.images[i];
        const { headers } = await axios.head(image.url ?? "");
        if (!new URL(image.url ?? "").hostname.includes("stuplus-bucket.s3") || headers["accept-ranges"] != "bytes" || parseInt(headers["content-length"]) > 10485760)
          throw new NotValidError("Yüklenen görseller değişmiş, bir şeyler yapmaya çalışıyorsanız bırakın, çalışmıyorsanız bizimle iletişime geçin, teşekkürler")
      }
    }
    response.data = await QuestionAccess.addQuestion(req.selectedLangs(), payload, res.locals.user._id);

    response.setMessage(getMessage("questionAdded", req.selectedLangs()));

  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/getQuestions", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateGetQuestionsQuestion, async (req: CustomRequest<QuestionGetMultipleDTO>, res: any) => {
  /* #swagger.tags = ['Question']
      #swagger.description = 'Get questions.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/QuestionGetQuestionsRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/QuestionGetQuestionsResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await QuestionAccess.getQuestions(req.selectedLangs(), new QuestionGetMultipleDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.get("/getQuestion/:id", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), async (req: CustomRequest<object>, res: any) => {
  /* #swagger.tags = ['Question']
      #swagger.description = 'Get question by id.' */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/QuestionGetQuestionResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await QuestionAccess.getQuestion(req.selectedLangs(), req.params.id, res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/likeDislike", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateLikeDislikeQuestion, async (req: CustomRequest<QuestionLikeDislikeDTO>, res: any) => {
  /* #swagger.tags = ['Question']
  #swagger.description = 'Like or dislike an question.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/QuestionLikeDislikeRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await QuestionAccess.likeDislikeQuestion(req.selectedLangs(), new QuestionLikeDislikeDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/getComments", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateGetCommentsQuestion, async (req: CustomRequest<QuestionGetCommentsDTO>, res: any) => {
  /* #swagger.tags = ['Question']
      #swagger.description = 'Get comments of a question.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/QuestionGetCommentsRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/QuestionGetCommentsResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await QuestionAccess.getComments(req.selectedLangs(), new QuestionGetCommentsDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/comment", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateCommentQuestion, async (req: CustomRequest<QuestionCommentDTO>, res: any) => {
  /* #swagger.tags = ['Question']
#swagger.description = 'Comment to a question.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/QuestionCommentRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<any>();
  try {
    response.data = await QuestionAccess.commentQuestion(req.selectedLangs(), new QuestionCommentDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  Ok(res, response)

  const question = await QuestionEntity.findOne({ _id: req.body.questionId }, { _id: 0, ownerId: 1, title: 1 });
  if (question) {
    await OneSignalService.sendNotificationWithUserIds({
      userIds: [question.ownerId],
      heading: `${truncate(question.title, 20)} yeni bir yorum aldı.`,
      content: `${truncate(req.body.comment, 50)}`,
      chatId: req.body.questionId,
      data: {
        type: OSNotificationType.QuestionNewComment,
        questionId: req.body.questionId,
        commentId: response.data?._id
      }
    })
  }
});

router.post("/commentLikeDislike", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateCommentLikeDislikeQuestion, async (req: CustomRequest<QuestionCommenLikeDisliketDTO>, res: any) => {
  /* #swagger.tags = ['Question']
#swagger.description = 'Like or dislike a anouncement's comment.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/QuestionCommentLikeDislikeRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await QuestionAccess.commentLikeDislikeQuestion(req.selectedLangs(), new QuestionCommenLikeDisliketDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/getSubComments", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateGetSubCommentsQuestion, async (req: CustomRequest<QuestionGetSubCommentsDTO>, res: any) => {
  /* #swagger.tags = ['Question']
      #swagger.description = 'Get sub comments of a comment.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/QuestionGetSubCommentsRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/QuestionGetSubCommentsResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await QuestionAccess.getSubComments(req.selectedLangs(), new QuestionGetSubCommentsDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

router.post("/subComment", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSubCommentQuestion, async (req: CustomRequest<QuestionSubCommentDTO>, res: any) => {
  /* #swagger.tags = ['Question']
#swagger.description = 'Comment to a comment.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/QuestionSubCommentRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<any>();
  try {
    response.data = await QuestionAccess.subCommentQuestion(req.selectedLangs(), new QuestionSubCommentDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  Ok(res, response)

  const question = await QuestionEntity.findOne({ _id: req.body.questionId }, { _id: 0, ownerId: 1, title: 1 });
  if (question) {
    await OneSignalService.sendNotificationWithUserIds({
      userIds: [question.ownerId],
      heading: `${truncate(question.title, 20)} yeni bir yorum aldı.`,
      content: `${truncate(req.body.comment, 50)}`,
      chatId: req.body.questionId,
      data: {
        type: OSNotificationType.QuestionNewSubComment,
        questionId: req.body.questionId,
        subCommentId: response.data?._id
      }
    })
  }
  const comment = await QuestionCommentEntity.findOne({ _id: req.body.commentId }, { _id: 0, ownerId: 1 });
  if (comment) {
    const subCommentOwner = await UserEntity.findOne({ _id: res.locals.user._id }, { _id: 0, username: 1 });
    if (subCommentOwner) {
      await OneSignalService.sendNotificationWithUserIds({
        userIds: [comment.ownerId],
        heading: `${truncate(subCommentOwner.username, 20)} yorumuna cevap verdi.`,
        content: `${truncate(req.body.comment, 50)}`,
        chatId: req.body.commentId,
        data: {
          type: OSNotificationType.QuestionCommentResponse,
          questionId: req.body.questionId,
          commentId: req.body.commentId,
          subCommentId: response.data?._id
        }
      });
    }
  }
});

router.post("/subCommentLikeDislike", authorize([Role.ContentCreator, Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSubCommentLikeDislikeQuestion, async (req: CustomRequest<QuestionSubCommenLikeDisliketDTO>, res: any) => {
  /* #swagger.tags = ['Question']
#swagger.description = 'Like or dislike a question's sub comment.' */
  /*	#swagger.requestBody = {
required: true,
schema: { $ref: "#/definitions/QuestionSubCommentLikeDislikeRequest" }
} */
  /* #swagger.responses[200] = {
   "description": "Success",
   "schema": {
     "$ref": "#/definitions/NullResponse"
   }
 } */
  const response = new BaseResponse<object>();
  try {
    response.data = await QuestionAccess.subCommentLikeDislikeQuestion(req.selectedLangs(), new QuestionSubCommenLikeDisliketDTO(req.body), res.locals.user._id);
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response, err);
  }

  return Ok(res, response)
});

export default router;
