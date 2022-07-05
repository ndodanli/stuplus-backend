import { Router } from "express"
import { InterestEntity, UserEntity } from "../../stuplus-lib/entities/BaseEntity";
import NotValidError from "../../stuplus-lib/errors/NotValidError";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import BaseResponse from "../../stuplus-lib/utils/base/BaseResponse";
import { InternalError, Ok } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { AddUpdateInterestDTO, InterestListDTO } from "../dtos/interest";
import { authorize } from "../middlewares/auth";
import { RecordStatus, Role } from "../../stuplus-lib/enums/enums";
import { SortOrder } from "mongoose";
import RedisService from "../../stuplus-lib/services/redisService";

const router = Router();

router.get("/list", authorize([Role.Admin]), async (req: CustomRequest<InterestListDTO>, res: any) => {
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

    let temp = InterestEntity.find({}).skip(skip).limit(limit).sort(sortFilter);
    if (search) {
      temp.or([
        { title: { $regex: search, $options: "i" } },
      ]);
    }
    let interests = await temp;
    const total = await InterestEntity.countDocuments();
    response.data = { items: interests, total: total };
  } catch (err: any) {
    response.setErrorMessage(err.message)

    if (err.status != 200)
      return InternalError(res, response);
  }

  return Ok(res, response)
});

router.post("/addUpdateInterest", authorize([Role.Admin]), async (req: CustomRequest<AddUpdateInterestDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const Interest = new AddUpdateInterestDTO(req.body);
    if (Interest._id) {
      const interestToUpdate = await InterestEntity.findById(Interest._id);
      if (!interestToUpdate) {
        response.setErrorMessage("Interest not found");
        throw new NotValidError("Interest not found", 404);
      }
      interestToUpdate.title = Interest.title;
      interestToUpdate.icon = Interest.icon;
      await interestToUpdate.save();
    }
    else {
      const newInterest = new InterestEntity(Interest);
      await newInterest.save();
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  await RedisService.updateInterests();

  return Ok(res, response)
});

router.delete("/deleteInterest", authorize([Role.Admin]), async (req: CustomRequest<InterestListDTO>, res: any) => {
  const response = new BaseResponse<object>();
  try {
    const interest = await InterestEntity.findOne({ _id: req.body._id });
    if (!interest) {
      throw new NotValidError("Interest not found", 404);
    }
    interest.recordStatus = RecordStatus.Deleted;

    const bulkUserUpdateOps = [];
    const usersWhoRelatedTointerest = await UserEntity.find({})
      .or([
        { interestId: interest._id },
        { relatedinterestIds: { $in: [interest._id] } }
      ]);
    for (let user of usersWhoRelatedTointerest) {
      user.interestIds = user.interestIds.filter(id => id != interest._id.toString());
      bulkUserUpdateOps.push({
        updateOne: {
          filter: {
            _id: user._id.toString()
          },
          update: {
            interestIds: user.interestIds
          }
        }
      });
    }
    await UserEntity.bulkWrite(bulkUserUpdateOps);
    await interest.save();
    for (let user of usersWhoRelatedTointerest) {
      RedisService.updateUser(user)
    }
  } catch (err: any) {

    response.setErrorMessage(err.message)
    if (err.status != 200)
      return InternalError(res, response);
  }

  await RedisService.updateInterests();
  return Ok(res, response)
});

export default router;
