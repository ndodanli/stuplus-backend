import { body, CustomValidator } from 'express-validator';

export const noUsage: CustomValidator = async (obj, { req }) => {
    if (typeof obj != "undefined") {
        throw new Error("Geçersiz obje.")
    }
}