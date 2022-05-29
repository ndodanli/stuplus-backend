import { Request, Response } from "express";

export interface CustomRequest<T> extends Omit<Request, 'body' | 'user'> {
    body: T | any;
    user: any;
    fileValidationErrors: [];
    selectedLangs: Function;
}
export interface CustomResponse extends Response {
}