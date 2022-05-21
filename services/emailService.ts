import { config } from "../config/config";
import nodemailer from "nodemailer";

export default class EmailService {
    private static emailTransporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.HOST_EMAIL || config.EMAIL_SERVICE.HOST_EMAIL,
            pass: process.env.HOST_EMAIL_PASSWORD || config.EMAIL_SERVICE.HOST_EMAIL_PASSWORD
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
