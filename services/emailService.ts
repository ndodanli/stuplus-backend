import { config } from "../config/config";
import nodemailer from "nodemailer";

export default class EmailService {
    private static emailTransporter = nodemailer.createTransport({
        service: "Gmail",
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
