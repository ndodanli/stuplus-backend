import path from "path";
import logger from "../config/logger";
import { stringify } from "../utils/general";
import axios from "axios";
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

export default class TelegramService {
    public static sendMessage = async (message: string) => {
        try {
            await axios.get(`https://api.telegram.org/bot5509873627:AAH_qp4jqMSBZQGvs0O4Rn4ABBm9eblnfZU/sendMessage?chat_id=-1001612359492&text=${message}`);
        } catch (err: any) {
            logger.error({ err: err }, `Telegram sendMessage failed. {Data}`, stringify({ ErorMessage: err.message }));
            console.error({ err: err }, `[${new Date()}]Telegram sendMessage failed. {Data}`, stringify({ ErorMessage: err.message }));
        }
    }
}
