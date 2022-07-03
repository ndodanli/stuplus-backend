import { QuestionCommentEntity, QuestionCommentLikeEntity, QuestionEntity, QuestionLikeEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { QuestionDocument } from "../../stuplus-lib/entities/QuestionEntity";
import { QuestionAddDTO, QuestionCommenLikeDisliketDTO, QuestionCommentDTO, QuestionLikeDislikeDTO, QuestionGetMultipleDTO, QuestionGetCommentsDTO } from "../dtos/QuestionDTOs";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import RedisService from "../../stuplus-lib/services/redisService";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import { stringify } from "../../stuplus-lib/utils/general";
import { LikeType, RecordStatus } from "../../stuplus-lib/enums/enums";
import { QuestionCommentDocument } from "../../stuplus-lib/entities/QuestionCommentEntity";
import sanitizeHtml from 'sanitize-html';

export class QuestionAccess {
    public static async addQuestion(acceptedLanguages: Array<string>, payload: QuestionAddDTO, currentUserId: string): Promise<Boolean> {
        const user = await UserEntity.findOne({ _id: currentUserId }, ["relatedSchoolIds"], { lean: true });

        if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

        if (typeof payload.relatedSchoolIds === "string")
            payload.relatedSchoolIds = payload.relatedSchoolIds.split(",");

        payload.text = sanitizeHtml(payload.text);

        await QuestionEntity.create(new QuestionEntity({
            ...payload,
            ownerId: currentUserId,
        }));

        return true;
    }

    public static async getQuestions(acceptedLanguages: Array<string>, payload: QuestionGetMultipleDTO, currentUserId: string): Promise<QuestionDocument[] | null> {
        let questionsQuery = QuestionEntity.find({});
        if (payload.schoolIds && payload.schoolIds.length) {
            questionsQuery = questionsQuery.where({
                $or: [
                    { relatedSchoolIds: { $in: payload.schoolIds } },
                    { relatedSchoolIds: [] }
                ]
            });
        }
        // else {
        //     var user = await RedisService.acquireUser(currentUserId);
        //     if (user?.schoolId) {
        //         questionsQuery = questionsQuery.where({ relatedSchoolIds: { $in: [user.schoolId] } });
        //     }
        // };
        const questions = await questionsQuery.sort({ createdAt: -1 }).skip(payload.skip).limit(payload.take).lean(true);

        if (questions.length) {
            let questionIds = questions.map(x => x._id);
            let questionUserIds = [...new Set(questions.map(x => x.ownerId))];
            let questionUsers = await UserEntity.find({ _id: { $in: questionUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
            let likedDislikedQuestions = await QuestionLikeEntity.find({ questionId: { $in: questionIds }, ownerId: currentUserId }, { "_id": 0, "questionId": 1, "type": 1 }, { lean: true });
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                //TODO:IMPROVEMENT: scan edilebilir
                const redisQuestionLikes = await RedisService.client.lRange(RedisKeyType.DBQuestionLike + question._id.toString(), 0, -1);
                const redisQuestionDislikes = await RedisService.client.lRange(RedisKeyType.DBQuestionDislike + question._id.toString(), 0, -1);
                question.likeCount = await RedisService.acquire<number>(RedisKeyType.QuestionLikeCount + question._id.toString(), 10, async () => {
                    let likeCount = 0;
                    likeCount += redisQuestionLikes.length;
                    likeCount += await QuestionLikeEntity.countDocuments({ questionId: question._id, type: LikeType.Like })
                    return likeCount;
                });
                question.commentCount += await RedisService.acquire<number>(RedisKeyType.QuestionCommentCount + question._id, 30, async () => {
                    let commentCount = 0;
                    commentCount += await RedisService.client.lLen(RedisKeyType.DBQuestionComment + question._id.toString());
                    commentCount += await QuestionCommentEntity.countDocuments({ questionId: question._id });
                    return commentCount;
                });
                question.owner = questionUsers.find(y => y._id.toString() === question.ownerId);

                let likeType;
                likeType = redisQuestionLikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
                if (!likeType) {
                    likeType = redisQuestionDislikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
                    if (!likeType) {
                        likeType = likedDislikedQuestions.find(y => y.questionId.toString() === question._id.toString());
                        if (likeType) question.likeType = likeType.type;
                        else question.likeType = LikeType.None;
                    } else {
                        question.likeType = LikeType.Dislike;
                    }
                } else {
                    question.likeType = LikeType.Like;
                }
            }
        }
        return questions;
    }

    public static async getComments(acceptedLanguages: Array<string>, payload: QuestionGetCommentsDTO, currentUserId: string): Promise<QuestionCommentDocument[]> {
        let favoriteTake = 5;
        let comments: QuestionCommentDocument[] = [];
        let redisComments = [];
        let isFirstPage = !payload.lastRecordDate;

        if (isFirstPage) {
            redisComments = await RedisService.client
                .lRange(RedisKeyType.DBQuestionComment + payload.questionId, 0, -1).then(x => x.map(y => JSON.parse(y).e));
            for (let i = redisComments.length - 1; i >= 0; i--) {
                comments.push(redisComments[i]);
            }
            payload.take -= redisComments.length;
            let favoriteComments = await QuestionCommentEntity.find({
                questionId: payload.questionId
            }).sort({ score: -1, createdAt: -1 }).limit(favoriteTake).lean(true);
            if (favoriteComments.length != favoriteTake)
                payload.take = 0;
            else
                payload.take -= favoriteComments.length;

            for (let i = 0; i < favoriteComments.length; i++) {
                comments.unshift(favoriteComments[i]);
            }
        }

        if (payload.take > 0) {
            const favoriteCommentIds = comments.map(x => x._id);
            let query = QuestionCommentEntity.find({
                questionId: payload.questionId,
                _id: { $nin: favoriteCommentIds }
            })

            if (!isFirstPage)
                query = query.where({ createdAt: { $lt: payload.lastRecordDate } });

            let newComments = await query.sort({ createdAt: -1 }).limit(payload.take).lean(true);
            for (let i = 0; i < newComments.length; i++) {
                const newComment = newComments[i];
                if (!comments.some(x => x._id.toString() === newComment._id.toString())) {
                    comments.push(newComment);
                }
            }
        }

        if (comments.length) {
            const commentIds = comments.map(x => x._id);
            const likedDislikedComments = await QuestionCommentLikeEntity.find({ commentId: { $in: commentIds }, ownerId: currentUserId }, { "_id": 0, "commentId": 1, "type": 1 }).lean(true);
            let commentUserIds = [...new Set(comments.map(x => x.ownerId))];
            let commentUsers = await UserEntity.find({ _id: { $in: commentUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
            for (let i = 0; i < comments.length; i++) {
                const comment = comments[i];
                const redisCommentLikes = await RedisService.client.lRange(RedisKeyType.DBQuestionCommentLike + comment._id.toString(), 0, -1);
                const redisCommentDislikes = await RedisService.client.lRange(RedisKeyType.DBQuestionCommentDislike + comment._id.toString(), 0, -1);
                comment.owner = commentUsers.find(y => y._id.toString() === comment.ownerId);
                comment.likeCount = await RedisService.acquire<number>(RedisKeyType.QuestionCommentLikeCount + comment._id, 20, async () => {
                    let likeCount = 0;
                    likeCount += redisCommentLikes.length;
                    likeCount += await QuestionCommentLikeEntity.countDocuments({ questionId: payload.questionId, commentId: comment._id, type: LikeType.Like });
                    return likeCount;
                });
                let likeType;
                likeType = redisCommentLikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
                if (!likeType) {
                    likeType = redisCommentDislikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
                    if (!likeType) {
                        likeType = likedDislikedComments.find(y => y.commentId === comment._id.toString());
                        if (likeType) comment.likeType = likeType.type;
                        else comment.likeType = LikeType.None;
                    } else {
                        comment.likeType = LikeType.Dislike;
                    }
                } else {
                    comment.likeType = LikeType.Like;
                }
            }
        }
        return comments;
    }

    public static async likeDislikeQuestion(acceptedLanguages: Array<string>, payload: QuestionLikeDislikeDTO, currentUserId: string): Promise<object> {
        let redisQuestionLikes = await RedisService.client.lRange(RedisKeyType.DBQuestionLike + payload.questionId, 0, -1);
        let redisQuestionDislikes = await RedisService.client.lRange(RedisKeyType.DBQuestionDislike + payload.questionId, 0, -1);
        if (payload.beforeType == LikeType.Like) {
            let deleted = false;
            const redisLike = redisQuestionLikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
            if (redisLike) {
                deleted = await RedisService.client.lRem(RedisKeyType.DBQuestionLike + payload.questionId, -1, redisLike) != 0 ? true : false;
                //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
                if (!deleted)
                    deleted = await QuestionLikeEntity.findOneAndUpdate({ questionId: payload.questionId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            } else {
                deleted = await QuestionLikeEntity.findOneAndUpdate({ questionId: payload.questionId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            }
            //TODO: if (!deleted) 
            //throw error on socket
        } else if (payload.beforeType == LikeType.Dislike) {
            let deleted = false;
            const redisDislike = redisQuestionDislikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
            if (redisDislike) {
                deleted = await RedisService.client.lRem(RedisKeyType.DBQuestionDislike + payload.questionId, -1, redisDislike) != 0 ? true : false;
                //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
                if (!deleted)
                    deleted = await QuestionLikeEntity.findOneAndUpdate({ questionId: payload.questionId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            } else {
                deleted = await QuestionLikeEntity.findOneAndUpdate({ questionId: payload.questionId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            }
            //TODO: if (!deleted) 
            //throw error on socket
        }

        if (payload.type == payload.beforeType)
            return { beforeType: LikeType.None };

        let likeDislikeBefore = undefined;
        if (payload.type == LikeType.Like)
            likeDislikeBefore = redisQuestionLikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
        else
            likeDislikeBefore = redisQuestionDislikes.find(x => JSON.parse(x).e.ownerId === currentUserId);

        if (!likeDislikeBefore)
            likeDislikeBefore = await QuestionLikeEntity.findOne({ questionId: payload.questionId, ownerId: currentUserId });

        if (likeDislikeBefore)
            throw new NotValidError(getMessage("alreadyLikedOrDisliked", acceptedLanguages));
        //TODO: bu tur hatalari socketten gonder, responseu hemen don.

        for (let i = 0; i < 19; i++) {
            const now = new Date();
            const questionLikeDislikeEntity = new QuestionLikeEntity({});
            const questionLikeDislikeData: object = {
                e: {
                    _id: questionLikeDislikeEntity.id,
                    ownerId: currentUserId,
                    questionId: payload.questionId,
                    createdAt: now,
                    updatedAt: now,
                },
            }
            let redisKey = payload.type === LikeType.Like ? RedisKeyType.DBQuestionLike : RedisKeyType.DBQuestionDislike;
            redisKey += payload.questionId;
            await RedisService.client.rPush(redisKey, stringify(questionLikeDislikeData));

        }


        return { beforeType: payload.type };
    }

    public static async getQuestion(acceptedLanguages: Array<string>, questionId: string, currentUserId: string): Promise<QuestionDocument | null> {
        const now = new Date();
        const question = await QuestionEntity.findOne({ _id: questionId, }, {}, { lean: true });

        if (!question) throw new NotValidError(getMessage("questionNotFound", acceptedLanguages));
        if (!question.isActive || ((question.fromDate && question.fromDate > now)
            || (question.toDate && question.toDate < now))) throw new NotValidError(getMessage("questionNotAvailable", acceptedLanguages));

        const comments = await QuestionCommentEntity.find({ questionId: question._id }, { ownerId: 1, comment: 1 }, { lean: true, sort: { score: -1 }, limit: 20 });
        const requiredUserIds = comments.map(x => x.ownerId);
        requiredUserIds.push(question.ownerId);
        const requiredUsers = await UserEntity.find({ _id: { $in: requiredUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });

        question.owner = requiredUsers.find(x => x._id.toString() === question.ownerId);
        const redisQuestionLikes = await RedisService.client.lRange(RedisKeyType.DBQuestionLike + question._id.toString(), 0, -1);
        const redisQuestionDislikes = await RedisService.client.lRange(RedisKeyType.DBQuestionDislike + question._id.toString(), 0, -1);
        question.likeCount = await RedisService.acquire<number>(RedisKeyType.QuestionLikeCount + question._id.toString(), 30, async () => {
            let likeCount = 0;
            likeCount += redisQuestionLikes.length;
            likeCount += await QuestionLikeEntity.countDocuments({ questionId: question._id, type: LikeType.Like });
            return likeCount;
        });
        let likeType;
        likeType = redisQuestionLikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
        if (!likeType) {
            likeType = redisQuestionDislikes.map(y => JSON.parse(y).e.ownerId).includes(currentUserId);
            if (!likeType) {
                likeType = await QuestionLikeEntity.findOne({ questionId: question._id, ownerId: currentUserId }, { "_id": 0, "type": 1 });
                if (likeType) question.likeType = likeType.type;
                else question.likeType = LikeType.None;
            } else {
                question.likeType = LikeType.Dislike;
            }
        } else {
            question.likeType = LikeType.Like;
        }

        let questionCommentGetDTO = new QuestionGetCommentsDTO({
            page: 1,
            pageSize: 20,
            questionId: question._id.toString(),
        });
        question.comments = await QuestionAccess.getComments(acceptedLanguages, questionCommentGetDTO, currentUserId);
        return question;
    }

    public static async commentQuestion(acceptedLanguages: Array<string>, payload: QuestionCommentDTO, currentUserId: string): Promise<Boolean> {
        let now = new Date();
        const questionCommentEntity = new QuestionCommentEntity({});
        const questionCommentData: object = {
            e: {
                _id: questionCommentEntity.id,
                ownerId: currentUserId,
                questionId: payload.questionId,
                comment: payload.comment,
                score: 0,
                createdAt: now,
                updatedAt: now
            },
        }
        await RedisService.client.rPush(RedisKeyType.DBQuestionComment + payload.questionId, stringify(questionCommentData));

        return true;
    }

    public static async commentLikeDislikeQuestion(acceptedLanguages: Array<string>, payload: QuestionCommenLikeDisliketDTO, currentUserId: string): Promise<object> {
        let redisQuestionCommentLikes = await RedisService.client.lRange(RedisKeyType.DBQuestionCommentLike + payload.commentId, 0, -1);
        let redisQuestionCommentDislikes = await RedisService.client.lRange(RedisKeyType.DBQuestionCommentDislike + payload.commentId, 0, -1);
        if (payload.beforeType == LikeType.Like) {
            let deleted = false;
            const redisLike = redisQuestionCommentLikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
            if (redisLike) {
                deleted = await RedisService.client.lRem(RedisKeyType.DBQuestionCommentLike + payload.commentId, -1, redisLike) != 0 ? true : false;
                if (!deleted)
                    deleted = await QuestionCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            } else {
                deleted = await QuestionCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            }
            //TODO: if (!deleted) 
            //throw error on socket
        } else if (payload.beforeType == LikeType.Dislike) {
            let deleted = false;
            const redisDislike = redisQuestionCommentDislikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
            if (redisDislike) {
                deleted = await RedisService.client.lRem(RedisKeyType.DBQuestionCommentDislike + payload.commentId, -1, redisDislike) != 0 ? true : false;
                if (!deleted)
                    deleted = await QuestionCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            } else {
                deleted = await QuestionCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted }) ? true : false;
            }
            //TODO: if (!deleted) 
            //throw error on socket
        }

        if (payload.type == payload.beforeType)
            return { beforeType: LikeType.None };

        let likeDislikeBefore = undefined;
        if (payload.type == LikeType.Like)
            likeDislikeBefore = redisQuestionCommentLikes.find(x => JSON.parse(x).e.ownerId === currentUserId);
        else
            likeDislikeBefore = redisQuestionCommentDislikes.find(x => JSON.parse(x).e.ownerId === currentUserId);

        if (!likeDislikeBefore)
            likeDislikeBefore = await QuestionCommentLikeEntity.findOne({ commentId: payload.commentId, ownerId: currentUserId });

        if (likeDislikeBefore)
            throw new NotValidError(getMessage("alreadyLikedOrDisliked", acceptedLanguages));
        //TODO: bu tur hatalari socketten gonder, responseu hemen don.

        const now = new Date();
        const questionCommentLikeEntity = new QuestionCommentLikeEntity({});
        const questionCommentLikeDislikeData: object = {
            e: {
                _id: questionCommentLikeEntity.id,
                ownerId: currentUserId,
                questionId: payload.questionId,
                commentId: payload.commentId,
                createdAt: now,
                updatedAt: now
            },
        }
        let redisKey = payload.type === LikeType.Like ? RedisKeyType.DBQuestionCommentLike : RedisKeyType.DBQuestionCommentDislike;
        redisKey += payload.commentId;
        await RedisService.client.rPush(redisKey, stringify(questionCommentLikeDislikeData));
        return { beforeType: payload.type };
    }
}