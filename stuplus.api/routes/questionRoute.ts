import { Router } from "express"
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import { validateAddQuestion, validateCommentQuestion, validateCommentLikeDislikeQuestion, validateGetQuestionsQuestion, validateGetCommentsQuestion, validateLikeDislikeQuestion } from "../middlewares/validation/question/validateQuestionRoute";
import { authorize } from "../middlewares/auth";
import { Role } from "../../stuplus-lib/enums/enums";
import { uploadSingleFileS3 } from "../../stuplus-lib/services/fileService";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { QuestionAddDTO, QuestionCommenLikeDisliketDTO, QuestionCommentDTO, QuestionLikeDislikeDTO, QuestionGetMultipleDTO, QuestionGetSingleDTO, QuestionGetCommentsDTO } from "../dtos/QuestionDTOs";
import { QuestionAccess } from "../dataAccess/questionAccess";
const router = Router();

router.post("/add", authorize([Role.ContentCreator, Role.Admin]), uploadSingleFileS3.single("coverImage", [".png", ".jpg", ".jpeg", ".svg"], "question/cover_images/", 5242880), validateAddQuestion, async (req: CustomRequest<QuestionAddDTO>, res: any) => {
    /* #swagger.tags = ['Question']
       #swagger.description = 'Add an question.' */
    /*	#swagger.requestBody = {
   required: true,
  "@content": {
                 "multipart/form-data": {
                     schema: {
                         type: "object",
                         properties: {
                             coverImage: {
                                 type: "string",
                                 format: "binary"
                             },
                             title: {
                                 type: "string",
                             },
                             text: {
                                 type: "string",
                             },
                             relatedSchoolIds: {
                                 type: "array",
                             }
                         },
                         required: ["title", "text"]
                     }
                 }
             } 
 } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/NullResponse"
     }
   } */
    const response = new BaseResponse<object>();
    try {
        if (req.fileValidationErrors?.length) {
            response.validationErrors = req.fileValidationErrors;
            throw new NotValidError(getMessage("fileError", req.selectedLangs()))
        }

        req.body.coverImageUrl = req.file?.location;

        await QuestionAccess.addQuestion(req.selectedLangs(), new QuestionAddDTO(req.body), res.locals.user._id);

        response.setMessage(getMessage("questionAdded", req.selectedLangs()));

    } catch (err: any) {
        response.setErrorMessage(err.message)

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/getQuestions", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateGetQuestionsQuestion, async (req: CustomRequest<QuestionGetMultipleDTO>, res: any) => {
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
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.get("/getQuestion/:id", authorize([Role.ContentCreator, Role.User, Role.Admin]), async (req: CustomRequest<object>, res: any) => {
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
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/likeDislike", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateLikeDislikeQuestion, async (req: CustomRequest<QuestionLikeDislikeDTO>, res: any) => {
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
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/getComments", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateGetCommentsQuestion, async (req: CustomRequest<QuestionGetCommentsDTO>, res: any) => {
    /* #swagger.tags = ['Question']
        #swagger.description = 'Get comments of an question.' */
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
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/comment", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateCommentQuestion, async (req: CustomRequest<QuestionCommentDTO>, res: any) => {
    /* #swagger.tags = ['Question']
#swagger.description = 'Comment to an question.' */
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
    const response = new BaseResponse<object>();
    try {
        await QuestionAccess.commentQuestion(req.selectedLangs(), new QuestionCommentDTO(req.body), res.locals.user._id);
    } catch (err: any) {
        response.setErrorMessage(err.message)

        if (err.status != 200)
            return InternalError(res, response);
    }

    return Ok(res, response)
});

router.post("/commentLikeDislike", authorize([Role.ContentCreator, Role.User, Role.Admin]), validateCommentLikeDislikeQuestion, async (req: CustomRequest<QuestionCommenLikeDisliketDTO>, res: any) => {
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
            return InternalError(res, response);
    }

    return Ok(res, response)
});

export default router;
