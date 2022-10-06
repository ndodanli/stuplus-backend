import { config } from "../config/config";
import nodemailer from "nodemailer";
import path from "path";
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

export default class EmailService {
    private static emailTransporter = nodemailer.createTransport({
        host: 'mail.stuplus.app',
        port: 465,
        secure: true,
        auth: {
            user: "info@stuplus.app",
            pass: "YQQ8EvwpAzAg9HL"
        },
    });

    public static sendEmail = async (to: string | string[], subject: string, text: string, html: string) => {
        return this.emailTransporter.sendMail({
            from: process.env.HOST_EMAIL || config.EMAIL_SERVICE.HOST_EMAIL,
            to: to,
            subject: subject,
            text: text,
            html: html
        });
    }
}
