import express from "express";
import { config } from "./config/config";
import logger from "./config/logger";

const app = express();

app.listen(config.PORT, () => {
        console.log(`Server started at http://localhost:${config.PORT}`);
    logger.info(`Cron Server started at http://localhost:${config.PORT}`);
});


