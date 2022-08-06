import { QuestionCommentEntity, QuestionCommentLikeEntity, QuestionEntity, QuestionLikeEntity, QuestionSubCommentEntity, QuestionSubCommentLikeEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import { Question, QuestionDocument } from "../../stuplus-lib/entities/QuestionEntity";
import { QuestionAddDTO, QuestionCommenLikeDisliketDTO, QuestionCommentDTO, QuestionLikeDislikeDTO, QuestionGetMultipleDTO, QuestionGetCommentsDTO, QuestionSubCommentDTO, QuestionSubCommenLikeDisliketDTO, QuestionGetSubCommentsDTO } from "../dtos/QuestionDTOs";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { getMessage } from "../../stuplus-lib/localization/responseMessages";
import RedisService from "../../stuplus-lib/services/redisService";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import { searchable, searchableWithSpaces, stringify } from "../../stuplus-lib/utils/general";
import { LikeType, RecordStatus } from "../../stuplus-lib/enums/enums";
import { QuestionCommentDocument } from "../../stuplus-lib/entities/QuestionCommentEntity";
import sanitizeHtml from 'sanitize-html';
import { QuestionSubCommentDocument } from "../../stuplus-lib/entities/QuestionSubCommentEntity";

export class QuestionAccess {
    public static async addQuestion(acceptedLanguages: Array<string>, payload: QuestionAddDTO, currentUserId: string): Promise<Question> {
        if (typeof payload.relatedSchoolIds === "string")
            payload.relatedSchoolIds = payload.relatedSchoolIds.split(",");

        payload.text = sanitizeHtml(payload.text);

        const redisOps: Promise<any>[] = [];
        if (payload.hashTags && payload.hashTags.length > 0) {
            payload.hashTags.forEach(async (x, index, arr) => {
                arr[index] = searchable(x);
                redisOps.push(RedisService.client.incr(RedisKeyType.DBHashtagEntity + `${arr[index]}`));
                redisOps.push(RedisService.client.incr(RedisKeyType.DBHashtagGroupPopularityIncr + `${arr[index]}:questionPopularity`));
            });
            await Promise.all(redisOps);
        }

        const question = await QuestionEntity.create(new QuestionEntity({
            ...payload,
            ownerId: currentUserId,
            titlesch: searchableWithSpaces(payload.title),
        }));

        return question;
    }

    public static async getQuestions(acceptedLanguages: Array<string>, payload: QuestionGetMultipleDTO, currentUserId: string): Promise<Question[] | null> {
        let questions: Question[] = [];
        let questionsQuery = QuestionEntity.find({});

        if (payload.schoolSearch) {
            questionsQuery = questionsQuery.where({ ownerSchoolId: payload.ownerSchoolId });
        } else {
            questionsQuery = questionsQuery.where({ ownerSchoolId: { $ne: payload.ownerSchoolId } });
        }

        if (payload.lastRecordDate)
            questionsQuery = questionsQuery.where({ createdAt: { $lt: payload.lastRecordDate } });

        questions = await questionsQuery
            .sort({ createdAt: -1 })
            .limit(payload.take)
            .lean(true);

        if (payload.schoolSearch && questions.length < payload.take) {
            let questionsSecond = await QuestionEntity.find({ ownerSchoolId: { $ne: payload.ownerSchoolId } })
                .sort({ createdAt: -1 })
                .limit(payload.take - questions.length)
                .lean(true);
            questions = questions.concat(questionsSecond);
        }

        if (questions.length) {
            let questionIds = questions.map(x => x._id);
            let questionUserIds = [...new Set(questions.map(x => x.ownerId))];
            let questionUsers = await UserEntity.find({ _id: { $in: questionUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
            let likedDislikedQuestions = await QuestionLikeEntity.find({ questionId: { $in: questionIds }, ownerId: currentUserId }, { "_id": 0, "questionId": 1, "type": 1 }, { lean: true });
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                //TODO:IMPROVEMENT: scan edilebilir
                question.likeCount = await RedisService.acquire<number>(RedisKeyType.QuestionLikeCount + question._id.toString(), 10, async () => {
                    let likeCount = 0;
                    likeCount += await RedisService.client.hLen(RedisKeyType.DBQuestionLike + question._id.toString());
                    likeCount += await QuestionLikeEntity.countDocuments({ questionId: question._id, type: LikeType.Like })
                    return likeCount;
                });
                question.commentCount = await RedisService.acquire<number>(RedisKeyType.QuestionCommentCount + question._id.toString(), 10, async () => {
                    let commentCount = 0;
                    commentCount += await RedisService.client.hLen(RedisKeyType.DBQuestionComment + question._id.toString());
                    // commentCount += await RedisService.client.hLen(RedisKeyType.DBQuestionSubComment + question._id.toString());
                    commentCount += await QuestionCommentEntity.countDocuments({ questionId: question._id });
                    commentCount += await QuestionSubCommentEntity.countDocuments({ questionId: question._id });
                    return commentCount;
                });
                question.owner = questionUsers.find(y => y._id.toString() === question.ownerId);

                let likeType;
                likeType = await RedisService.client.hExists(RedisKeyType.DBQuestionLike + question._id.toString(), currentUserId);
                if (!likeType) {
                    likeType = await RedisService.client.hExists(RedisKeyType.DBQuestionDislike + question._id.toString(), currentUserId);
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
        let isFirstPage = !payload.lastRecordDate;
        // const redisMaxCommentCount = -30;

        if (isFirstPage) {
            let favoriteComments = await QuestionCommentEntity.find({
                questionId: payload.questionId
            }).sort({ popularity: -1, createdAt: -1 }).limit(favoriteTake).lean(true);
            if (favoriteComments.length < favoriteTake)
                payload.take = 0;

            for (let i = 0; i < favoriteComments.length; i++) {
                comments.push(favoriteComments[i]);
            }
            const favoriteCommentIds = comments.map(x => x._id);

            const redisComments = await RedisService.client
                .hVals(RedisKeyType.DBQuestionComment + payload.questionId).then(x => x.map(y => JSON.parse(y).e));

            payload.take -= redisComments.length
            let newComments: QuestionCommentDocument[] = [];
            if (payload.take > 0) {
                let newCommentsQuery = QuestionCommentEntity.find({
                    questionId: payload.questionId,
                    _id: { $nin: favoriteCommentIds },
                });

                if (redisComments.length > 0)
                    newCommentsQuery = newCommentsQuery.where({ createdAt: { $lt: redisComments[0].createdAt } });

                newComments = await newCommentsQuery.sort({ createdAt: -1 }).limit(payload.take).lean(true);
            }

            for (let i = redisComments.length - 1; i >= 0; i--)
                comments.push(redisComments[i]);

            for (let i = 0; i < newComments.length; i++)
                comments.push(newComments[i]);

        } else {
            comments = await QuestionCommentEntity.find({
                questionId: payload.questionId,
                createdAt: { $lt: payload.lastRecordDate }
            }).sort({ createdAt: -1 }).limit(payload.take).lean(true);
        }

        if (comments.length) {
            const commentIds = comments.map(x => x._id);
            const likedDislikedComments = await QuestionCommentLikeEntity.find({ commentId: { $in: commentIds }, ownerId: currentUserId }, { "_id": 0, "commentId": 1, "type": 1 }).lean(true);
            let commentUserIds = [...new Set(comments.map(x => x.ownerId))];
            let commentUsers = await UserEntity.find({ _id: { $in: commentUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
            for (let i = 0; i < comments.length; i++) {
                const comment = comments[i];
                comment.owner = commentUsers.find(y => y._id.toString() === comment.ownerId);
                comment.likeCount = await RedisService.acquire<number>(RedisKeyType.QuestionCommentLikeCount + comment._id, 20, async () => {
                    let likeCount = 0;
                    likeCount += await RedisService.client.hLen(RedisKeyType.DBQuestionCommentLike + comment._id.toString());
                    likeCount += await QuestionCommentLikeEntity.countDocuments({ commentId: comment._id, type: LikeType.Like });
                    return likeCount;
                });
                comment.subCommentCount = await RedisService.acquire<number>(RedisKeyType.QuestionSubCommentCount + comment._id.toString(), 10, async () => {
                    let subCommentCount = 0;
                    subCommentCount += await RedisService.client.hLen(RedisKeyType.DBQuestionSubComment + comment._id.toString());
                    subCommentCount += await QuestionSubCommentEntity.countDocuments({ commentId: comment._id });
                    return subCommentCount;
                });
                let likeType;
                likeType = await RedisService.client.hExists(RedisKeyType.DBQuestionCommentLike + comment._id.toString(), currentUserId);
                if (!likeType) {
                    likeType = await RedisService.client.hExists(RedisKeyType.DBQuestionCommentDislike + comment._id.toString(), currentUserId);
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

    public static async getSubComments(acceptedLanguages: Array<string>, payload: QuestionGetSubCommentsDTO, currentUserId: string): Promise<QuestionSubCommentDocument[]> {
        let subComments: QuestionSubCommentDocument[] = [];
        let isFirstPage = !payload.lastRecordDate;
        // const redisMaxCommentCount = -30;

        if (isFirstPage) {
            const redisSubComments = await RedisService.client
                .hVals(RedisKeyType.DBQuestionSubComment + payload.commentId).then(x => x.map(y => JSON.parse(y).e));

            payload.take -= redisSubComments.length
            let newSubComments: QuestionSubCommentDocument[] = [];
            if (payload.take > 0) {
                let newSubCommentsQuery = QuestionSubCommentEntity.find({
                    commentId: payload.commentId,
                });

                if (redisSubComments.length > 0)
                    newSubCommentsQuery = newSubCommentsQuery.where({ createdAt: { $lt: redisSubComments[0].createdAt } });

                newSubComments = await newSubCommentsQuery.sort({ createdAt: 1 }).limit(payload.take).lean(true);
            }

            for (let i = 0; i < newSubComments.length; i++)
                subComments.push(newSubComments[i]);

            for (let i = 0; i < redisSubComments.length; i++)
                subComments.push(redisSubComments[i]);


        } else {
            subComments = await QuestionSubCommentEntity.find({
                commentId: payload.commentId,
                createdAt: { $gt: payload.lastRecordDate }
            }).sort({ createdAt: 1 }).limit(payload.take).lean(true);
        }

        if (subComments.length) {
            const subCommentIds = subComments.map(x => x._id);
            const likedDislikedSubComments = await QuestionSubCommentLikeEntity.find({ subCommentId: { $in: subCommentIds }, ownerId: currentUserId }, { "_id": 0, "subCommentId": 1, "type": 1 }).lean(true);
            let subCommentUserIds = [...new Set(subComments.map(x => x.ownerId))];
            let subCommentUsers = await UserEntity.find({ _id: { $in: subCommentUserIds } }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
            for (let i = 0; i < subComments.length; i++) {
                const subComment = subComments[i];
                subComment.owner = subCommentUsers.find(y => y._id.toString() === subComment.ownerId);
                subComment.likeCount = await RedisService.acquire<number>(RedisKeyType.QuestionSubCommentLikeCount + subComment._id, 20, async () => {
                    let likeCount = 0;
                    likeCount += await RedisService.client.hLen(RedisKeyType.DBQuestionSubCommentLike + subComment._id.toString());
                    likeCount += await QuestionSubCommentLikeEntity.countDocuments({ subCommentId: subComment._id, type: LikeType.Like });
                    return likeCount;
                });
                let likeType;
                likeType = await RedisService.client.hExists(RedisKeyType.DBQuestionSubCommentLike + subComment._id.toString(), currentUserId);
                if (!likeType) {
                    likeType = await RedisService.client.hExists(RedisKeyType.DBQuestionSubCommentDislike + subComment._id.toString(), currentUserId);
                    if (!likeType) {
                        likeType = likedDislikedSubComments.find(y => y.subCommentId === subComment._id.toString());
                        if (likeType) subComment.likeType = likeType.type;
                        else subComment.likeType = LikeType.None;
                    } else {
                        subComment.likeType = LikeType.Dislike;
                    }
                } else {
                    subComment.likeType = LikeType.Like;
                }
            }
        }
        return subComments;
    }

    public static async likeDislikeQuestion(acceptedLanguages: Array<string>, payload: QuestionLikeDislikeDTO, currentUserId: string): Promise<object> {
        if (await RedisService.isDailyLikeLimitExceeded(currentUserId))
            throw new NotValidError(getMessage("dailyLikeLimitExceeded", acceptedLanguages));
        if (payload.beforeType == LikeType.Like) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBQuestionLike + payload.questionId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await QuestionLikeEntity.findOneAndUpdate({ questionId: payload.questionId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        } else if (payload.beforeType == LikeType.Dislike) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBQuestionDislike + payload.questionId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await QuestionLikeEntity.findOneAndUpdate({ questionId: payload.questionId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        }

        if (payload.type == payload.beforeType)
            return { beforeType: LikeType.None };

        let likeDislikeBefore = undefined;
        if (payload.type == LikeType.Like)
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBQuestionLike + payload.questionId, currentUserId);
        else if (payload.type == LikeType.Dislike)
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBQuestionDislike + payload.questionId, currentUserId);
        else
            throw new NotValidError(getMessage("likeDislikeTypeNotValid", acceptedLanguages));

        if (!likeDislikeBefore)
            likeDislikeBefore = await QuestionLikeEntity.findOne({ questionId: payload.questionId, ownerId: currentUserId });

        if (likeDislikeBefore)
            throw new NotValidError(getMessage("alreadyLikedOrDisliked", acceptedLanguages));
        //TODO: bu tur hatalari socketten gonder, responseu hemen don.

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
        await RedisService.client.hSet(redisKey, currentUserId, stringify(questionLikeDislikeData));

        return { beforeType: payload.type };
    }

    public static async getQuestion(acceptedLanguages: Array<string>, questionId: string, currentUserId: string): Promise<QuestionDocument | null> {
        const now = new Date();
        const question = await QuestionEntity.findOne({ _id: questionId, }, {}, { lean: true });

        if (!question) throw new NotValidError(getMessage("questionNotFound", acceptedLanguages));
        if (!question.isActive || ((question.fromDate && question.fromDate > now)
            || (question.toDate && question.toDate < now))) throw new NotValidError(getMessage("questionNotAvailable", acceptedLanguages));

        question.owner = await UserEntity.findOne({ _id: question.ownerId }, { "_id": 1, "username": 1, "profilePhotoUrl": 1, "schoolId": 1, "avatarKey": 1 }, { lean: true });
        question.likeCount = await RedisService.acquire<number>(RedisKeyType.QuestionLikeCount + question._id.toString(), 30, async () => {
            let likeCount = 0;
            likeCount += await RedisService.client.hLen(RedisKeyType.DBQuestionLike + question._id.toString());
            likeCount += await QuestionLikeEntity.countDocuments({ questionId: question._id, type: LikeType.Like });
            return likeCount;
        });
        question.commentCount = await RedisService.acquire<number>(RedisKeyType.QuestionCommentCount + question._id.toString(), 10, async () => {
            let commentCount = 0;
            commentCount += await RedisService.client.hLen(RedisKeyType.DBQuestionComment + question._id.toString());
            // commentCount += await RedisService.client.hLen(RedisKeyType.DBQuestionSubComment + question._id.toString());
            commentCount += await QuestionCommentEntity.countDocuments({ questionId: question._id });
            commentCount += await QuestionSubCommentEntity.countDocuments({ questionId: question._id });
            return commentCount;
        });
        let likeType;
        likeType = await RedisService.client.hExists(RedisKeyType.DBQuestionLike + question._id.toString(), currentUserId);
        if (!likeType) {
            likeType = await RedisService.client.hExists(RedisKeyType.DBQuestionDislike + question._id.toString(), currentUserId);
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
            questionId: question._id.toString(),
            take: 20,
        });
        question.comments = await QuestionAccess.getComments(acceptedLanguages, questionCommentGetDTO, currentUserId);
        return question;
    }

    public static async commentQuestion(acceptedLanguages: Array<string>, payload: QuestionCommentDTO, currentUserId: string): Promise<object> {
        if (await RedisService.isDailyCommentLimitExceeded(currentUserId))
            throw new NotValidError(getMessage("dailyCommentLimitExceeded", acceptedLanguages));

        let now = new Date();
        const questionCommentEntity = new QuestionCommentEntity({});
        const questionCommentData: object = {
            e: {
                _id: questionCommentEntity.id,
                ownerId: currentUserId,
                questionId: payload.questionId,
                comment: payload.comment,
                popularity: 0,
                createdAt: now,
                updatedAt: now
            },
        }
        await RedisService.client.hSet(RedisKeyType.DBQuestionComment + payload.questionId, questionCommentEntity.id, stringify(questionCommentData));

        await RedisService.incrementDailyCommentCount(currentUserId);
        return { _id: questionCommentEntity.id };
    }

    public static async commentLikeDislikeQuestion(acceptedLanguages: Array<string>, payload: QuestionCommenLikeDisliketDTO, currentUserId: string): Promise<object> {
        if (await RedisService.isDailyLikeLimitExceeded(currentUserId))
            throw new NotValidError(getMessage("dailyLikeLimitExceeded", acceptedLanguages));

        if (payload.beforeType == LikeType.Like) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBQuestionCommentLike + payload.commentId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await QuestionCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        } else if (payload.beforeType == LikeType.Dislike) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBQuestionCommentDislike + payload.commentId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await QuestionCommentLikeEntity.findOneAndUpdate({ commentId: payload.commentId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        }

        if (payload.type == payload.beforeType)
            return { beforeType: LikeType.None };

        let likeDislikeBefore = undefined;
        if (payload.type == LikeType.Like)
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBQuestionCommentLike + payload.commentId, currentUserId);
        else
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBQuestionCommentDislike + payload.commentId, currentUserId);

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
        await RedisService.client.hSet(redisKey, currentUserId, stringify(questionCommentLikeDislikeData));

        await RedisService.incrementDailyLikeCount(currentUserId);
        return { beforeType: payload.type };
    }

    public static async subCommentQuestion(acceptedLanguages: Array<string>, payload: QuestionSubCommentDTO, currentUserId: string): Promise<object> {
        if (await RedisService.isDailyCommentLimitExceeded(currentUserId))
            throw new NotValidError(getMessage("dailyCommentLimitExceeded", acceptedLanguages));
        let now = new Date();
        const questionSubCommentEntity = new QuestionSubCommentEntity({});
        const questionSubCommentData: any = {
            e: {
                _id: questionSubCommentEntity.id,
                ownerId: currentUserId,
                questionId: payload.questionId,
                commentId: payload.commentId,
                comment: payload.comment,
                popularity: 0,
                createdAt: now,
                updatedAt: now
            },
        }
        if (payload.replyToId)
            questionSubCommentData.e.replyToId = payload.replyToId;

        await RedisService.client.hSet(RedisKeyType.DBQuestionSubComment + payload.commentId, questionSubCommentEntity.id, stringify(questionSubCommentData));

        await RedisService.incrementDailyCommentCount(currentUserId);
        return { _id: questionSubCommentEntity.id.toString() };
    }

    public static async subCommentLikeDislikeQuestion(acceptedLanguages: Array<string>, payload: QuestionSubCommenLikeDisliketDTO, currentUserId: string): Promise<object> {
        if (await RedisService.isDailyLikeLimitExceeded(currentUserId))
            throw new NotValidError(getMessage("dailyLikeLimitExceeded", acceptedLanguages));
        if (payload.beforeType == LikeType.Like) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBQuestionSubCommentLike + payload.subCommentId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await QuestionSubCommentLikeEntity.findOneAndUpdate({ subCommentId: payload.subCommentId, ownerId: currentUserId, type: LikeType.Like }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        } else if (payload.beforeType == LikeType.Dislike) {
            let deleted: number = await RedisService.client.hDel(RedisKeyType.DBQuestionSubCommentDislike + payload.subCommentId, currentUserId);
            //TODO: silene kadar 0.5 saniye araliklarla dene(maksimum 5 kere)
            if (!deleted)
                await QuestionSubCommentLikeEntity.findOneAndUpdate({ subCommentId: payload.subCommentId, ownerId: currentUserId, type: LikeType.Dislike }, { recordStatus: RecordStatus.Deleted });
            //TODO: if (!deleted) 
            //throw error on socket
        }

        if (payload.type == payload.beforeType)
            return { beforeType: LikeType.None };

        let likeDislikeBefore = undefined;
        if (payload.type == LikeType.Like)
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBQuestionSubCommentLike + payload.subCommentId, currentUserId);
        else if (payload.type == LikeType.Dislike)
            likeDislikeBefore = await RedisService.client.hExists(RedisKeyType.DBQuestionSubCommentDislike + payload.subCommentId, currentUserId);
        else
            throw new NotValidError(getMessage("likeDislikeTypeNotValid", acceptedLanguages));

        if (!likeDislikeBefore)
            likeDislikeBefore = await QuestionSubCommentLikeEntity.findOne({ subCommentId: payload.subCommentId, ownerId: currentUserId });

        if (likeDislikeBefore)
            throw new NotValidError(getMessage("alreadyLikedOrDisliked", acceptedLanguages));
        //TODO: bu tur hatalari socketten gonder, responseu hemen don.

        const now = new Date();
        const questionSubCommentLikeEntity = new QuestionSubCommentLikeEntity({});
        const questionSubCommentLikeDislikeData: object = {
            e: {
                _id: questionSubCommentLikeEntity.id,
                ownerId: currentUserId,
                questionId: payload.questionId,
                commentId: payload.commentId,
                subCommentId: payload.subCommentId,
                createdAt: now,
                updatedAt: now
            },
        }
        let redisKey = payload.type === LikeType.Like ? RedisKeyType.DBQuestionSubCommentLike : RedisKeyType.DBQuestionSubCommentDislike;
        redisKey += payload.subCommentId;
        await RedisService.client.hSet(redisKey, currentUserId, stringify(questionSubCommentLikeDislikeData));

        await RedisService.incrementDailyLikeCount(currentUserId);
        return { beforeType: payload.type };
    }
}