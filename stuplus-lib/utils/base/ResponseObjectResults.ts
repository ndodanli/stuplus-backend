import { StatusCodes } from 'http-status-codes';
import logger from '../../config/logger';
import { stringify } from '../general';
import BaseResponse from "./BaseResponse";

export const Ok = (res: any, response: BaseResponse<any>) => {
    // logger.info(`[${new Date().toISOString()}]Endpoint: ${res.req.originalUrl} {Data}`, { body: res.req.body });
    console.info("\x1b[32m", `[${new Date().toISOString()}]Endpoint: ${res.req.originalUrl} {Data}`, { body: stringify(res.req.body) });
    return res.status(StatusCodes.OK).json(response);
}

export const InternalError = (res: any, response: BaseResponse<any>, err: any) => {
    logger.error({ err: err }, `An error ocurred. Endpoint: ${res.req.originalUrl}. {Data}`, stringify({ ErorMessage: err.message, body: res.req.body }));
    console.error({ err: err }, `[${new Date()}]An error ocurred. Endpoint: ${res.req.originalUrl}. {Data}`, stringify({ ErorMessage: err.message, body: res.req.body }));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
}
