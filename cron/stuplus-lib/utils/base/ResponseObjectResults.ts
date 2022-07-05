import { StatusCodes } from 'http-status-codes';
import BaseResponse from "./BaseResponse";

export const Ok = (res: any, response: BaseResponse<any>) => res.status(StatusCodes.OK).json(response);

export const InternalError = (res: any, response: BaseResponse<any>) => res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
