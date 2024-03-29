import jwt from "jsonwebtoken";
import path from "path";
import { config } from "../config/config";
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

export const getNewToken = (user: any) => {
    return jwt.sign(
        {
            _id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET || config.JWT_SECRET,
        {
            expiresIn: "360d",
        }
    );
};