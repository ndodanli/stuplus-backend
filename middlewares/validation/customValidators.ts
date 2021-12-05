import { body, CustomValidator } from 'express-validator';
// This allows you to reuse the validator
export const noUsage: CustomValidator = async (obj, { req }) => {
    if (typeof obj != "undefined") {
        throw new Error("Geçersiz obje.")
    }
}