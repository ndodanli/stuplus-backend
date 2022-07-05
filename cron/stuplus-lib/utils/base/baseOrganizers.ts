import { Request, Response } from "express";
import { } from "multer-s3"
import { SFile } from "./multer";
export interface CustomRequest<T> extends Omit<Request, 'body' | 'query' | 'user'> {
    body: T | any;
    query: T | any;
    user: any;
    fileValidationErrors: [];
    selectedLangs: Function;
    file: SFile
}
export interface CustomResponse<T> extends Omit<Response, 'json' | 'status' | 'send'> {
    send: (data: T) => void;
    json: (data: T) => void;
    status: (status: number) => void;
}