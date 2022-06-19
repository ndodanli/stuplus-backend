import { config } from "../config/config";
import jwt from "jsonwebtoken";

export const getNewToken = (user: any) => {
    return jwt.sign(
        {
            _id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET || config.JWT_SECRET,
        {
            expiresIn: "30d",
        }
    );
};