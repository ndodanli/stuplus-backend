import { StatusCodes } from 'http-status-codes';
import logger from '../../config/logger';
import { stringify } from '../general';
import BaseResponse from "./BaseResponse";

export const Ok = (res: any, response: BaseResponse<any>) => {
    logger.info(`Endpoint: ${res.req.originalUrl} {Data}`, { body: res.req.body });
    console.info("\x1b[32m", `Endpoint: ${res.req.originalUrl} {Data}`, { body: res.req.body });
    return res.status(StatusCodes.OK).json(response);
}

export const InternalError = (res: any, response: BaseResponse<any>, err: any) => {
    logger.error({ err: err }, `An error ocurred. {Data}`, stringify({ ErorMessage: err.message }));
    console.error({ err: err }, `An error ocurred. {Data}`, stringify({ ErorMessage: err.message }));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
}
