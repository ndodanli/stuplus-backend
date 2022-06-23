import { config } from "../config/config";
import nodemailer from "nodemailer";
import path from "path";
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

export default class EmailService {
    private static emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secure: true,
        auth: {
            user: "fakultemdestek@gmail.com",
            pass: "yqplxujmtvszkwmx"
        },
    });

    public static sendEmail = async (to: string | string[], subject: string, text: string, html: string) => {
        return this.emailTransporter.sendMail({
            from: process.env.HOST_EMAIL || config.EMAIL_SERVICE.HOST_EMAIL,
            to: to,
            subject: subject,
            text: text,
            html: html
        })
    }
}
