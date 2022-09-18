import { Router } from "express";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { authorize } from "../../stuplus.backoffice.api/middlewares/auth";
import { Role, SearchedEntityType } from "../../stuplus-lib/enums/enums";
import { validateSearch } from "../middlewares/validation/search/validateSearchRoute";
import { SearchGroupChatDTO, SearchGroupUsersDTO, SearchHashTagDTO, SearchPeopleAndGroupChatDTO, SearchPeopleDTO, SearchQuestionDTO } from "../dtos/SearchDTOs";
import { SearchAccess } from "../dataAccess/searchAccess";
import { SearchHistoryEntity } from "../../stuplus-lib/entities/BaseEntity";
import RedisService from "../../stuplus-lib/services/redisService";
import { RedisKeyType } from "../../stuplus-lib/enums/enums_socket";
import { stringify } from "../../stuplus-lib/utils/general";
const router = Router();

router.post("/people", authorize([Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSearch, async (req: CustomRequest<SearchPeopleDTO>, res: any) => {
    /* #swagger.tags = ['Search']
        #swagger.description = 'Get searched results(only users).' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/SearchPeopleRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/SearchPeopleResponse"
     }
   } */
    const response = new BaseResponse<any>();
    try {
        const payload = new SearchPeopleDTO(req.body);

        response.data = await SearchAccess.getSearchedUsers(res.locals.user._id, payload);

        const now = new Date();
        const searchHistoryEntity = new SearchHistoryEntity({});
        const sData: object = {
            e: {
                _id: searchHistoryEntity.id,
                searchTerm: payload.searchTerm,
                searchedEntities: [SearchedEntityType.User],
                foundedCount: response.data.length,
                ownerId: res.locals.user._id,
                createdAt: now,
                updatedAt: now,
            }
        }

        await RedisService.client.hSet(RedisKeyType.DBSearchHistory, res.locals.user._id, stringify(sData));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/groupChats", authorize([Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSearch, async (req: CustomRequest<SearchGroupChatDTO>, res: any) => {
    /* #swagger.tags = ['Search']
       #swagger.description = 'Get searched results(only group chats).' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/SearchGroupChatsRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/SearchGroupChatsResponse"
     }
   } */
    const response = new BaseResponse<any>();
    try {
        const payload = new SearchGroupChatDTO(req.body);

        response.data = await SearchAccess.getSearchedGroupChats(res.locals.user._id, payload);

        const now = new Date();
        const searchHistoryEntity = new SearchHistoryEntity({});
        const sData: object = {
            e: {
                _id: searchHistoryEntity.id,
                searchTerm: payload.searchTerm,
                searchedEntities: [SearchedEntityType.Group],
                foundedCount: response.data.length,
                ownerId: res.locals.user._id,
                createdAt: now,
                updatedAt: now,
            }
        }

        await RedisService.client.hSet(RedisKeyType.DBSearchHistory, res.locals.user._id, stringify(sData));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/peopleAndGroupChats", authorize([Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSearch, async (req: CustomRequest<SearchPeopleAndGroupChatDTO>, res: any) => {
    /* #swagger.tags = ['Search']
     #swagger.description = 'Get searched results(people and group chats).' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/SearchPeopleAndGroupChatsRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/SearchPeopleAndGroupChatsResponse"
     }
   } */

    const response = new BaseResponse<any>();
    try {
        const payload = new SearchPeopleAndGroupChatDTO(req.body);
        payload.pageSize = Math.floor(payload.pageSize / 2);
        const resultArray: any = [];

        const searchedGroups = await SearchAccess.getSearchedGroupChats(res.locals.user._id, payload);
        const searchedUsers = await SearchAccess.getSearchedUsers(res.locals.user._id, payload);

        resultArray.push(...searchedGroups);
        resultArray.push(...searchedUsers);

        //sort result array by confidence score
        resultArray.sort((a: any, b: any) => {
            return b.confidenceScore - a.confidenceScore;
        });

        response.data = resultArray;

        const now = new Date();
        const searchHistoryEntity = new SearchHistoryEntity({});
        const sData: object = {
            e: {
                _id: searchHistoryEntity.id,
                searchTerm: payload.searchTerm,
                searchedEntities: [SearchedEntityType.Group, SearchedEntityType.User],
                foundedCount: response.data.length,
                ownerId: res.locals.user._id,
                createdAt: now,
                updatedAt: now,
            }
        }

        await RedisService.client.hSet(RedisKeyType.DBSearchHistory, res.locals.user._id, stringify(sData));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/hashtag", authorize([Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSearch, async (req: CustomRequest<SearchHashTagDTO>, res: any) => {
    /* #swagger.tags = ['Search']
        #swagger.description = 'Get hashtags by search term.' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/SearchHashtagRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/SearchHashtagResponse"
     }
   } */
    const response = new BaseResponse<any>();
    try {
        const payload = new SearchHashTagDTO(req.body);

        response.data = await SearchAccess.getSearchedTags(res.locals.user._id, payload);

        const now = new Date();
        const searchHistoryEntity = new SearchHistoryEntity({});
        const sData: object = {
            e: {
                _id: searchHistoryEntity.id,
                searchTerm: payload.searchTerm,
                searchedEntities: [SearchedEntityType.Hashtag],
                foundedCount: response.data.length,
                ownerId: res.locals.user._id,
                createdAt: now,
                updatedAt: now,
            }
        }

        await RedisService.client.hSet(RedisKeyType.DBSearchHistory, res.locals.user._id, stringify(sData));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/question", authorize([Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSearch, async (req: CustomRequest<SearchQuestionDTO>, res: any) => {
    /* #swagger.tags = ['Search']
        #swagger.description = 'Get searched questions.' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/SearchQuestionRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/SearchQuestionResponse"
     }
   } */
    const response = new BaseResponse<any>();
    try {
        const payload = new SearchQuestionDTO(req.body);

        response.data = await SearchAccess.getSearchedQuestions(res.locals.user._id, payload);

        const now = new Date();
        const searchHistoryEntity = new SearchHistoryEntity({});
        const sData: object = {
            e: {
                _id: searchHistoryEntity.id,
                searchTerm: payload.searchTerm,
                searchedEntities: [SearchedEntityType.Question],
                foundedCount: response.data.length,
                ownerId: res.locals.user._id,
                createdAt: now,
                updatedAt: now,
            }
        }

        await RedisService.client.hSet(RedisKeyType.DBSearchHistory, res.locals.user._id, stringify(sData));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/announcement", authorize([Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSearch, async (req: CustomRequest<SearchQuestionDTO>, res: any) => {
    /* #swagger.tags = ['Search']
        #swagger.description = 'Get searched questions.' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/SearchQuestionRequest" }
  } */
    /* #swagger.responses[200] = {
     "description": "Success",
     "schema": {
       "$ref": "#/definitions/SearchQuestionResponse"
     }
   } */
    const response = new BaseResponse<any>();
    try {
        const payload = new SearchQuestionDTO(req.body);

        response.data = await SearchAccess.getSearchedAnnouncements(res.locals.user._id, payload);

        const now = new Date();
        const searchHistoryEntity = new SearchHistoryEntity({});
        const sData: object = {
            e: {
                _id: searchHistoryEntity.id,
                searchTerm: payload.searchTerm,
                searchedEntities: [SearchedEntityType.Announcement],
                foundedCount: response.data.length,
                ownerId: res.locals.user._id,
                createdAt: now,
                updatedAt: now,
            }
        }

        await RedisService.client.hSet(RedisKeyType.DBSearchHistory, res.locals.user._id, stringify(sData));
    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

router.post("/groupUsers", authorize([Role.User, Role.Admin, Role.ContentCreator, Role.Moderator]), validateSearch, async (req: CustomRequest<SearchGroupUsersDTO>, res: any) => {
    /* #swagger.tags = ['Search']
        #swagger.description = 'Get group users by search term.' */
    /*	#swagger.requestBody = {
  required: true,
  schema: { $ref: "#/definitions/SearchGroupUsersRequest" }
  } */
    const response = new BaseResponse<any>();
    try {
        const payload = new SearchGroupUsersDTO(req.body);

        response.data = await SearchAccess.getSearchedGroupUsers(res.locals.user._id, payload);

    } catch (err: any) {
        response.setErrorMessage(err.message);

        if (err.status != 200)
            return InternalError(res, response, err);
    }

    return Ok(res, response);
});

export default router;
