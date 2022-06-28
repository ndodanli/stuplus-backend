import logger from "./config/logger";
import express, { Request, Response, } from "express";
import { initializeDatabese } from "./config/database";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import loginRoute from "./routes/loginRoute";
import accountRoute from "./routes/accountRoute";
import schoolRoute from "./routes/schoolRoute";
import generalRoute from "./routes/generalRoute";
import path from "path";
import { config } from "./config/config";
import customExtensions from "../../stuplus-lib/extensions/extensions";

dotenv.config({path:".env"});

const app = express();

setup();

async function setup() {
    await initializeDatabese();
}
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
    cors()
    // cors({
    //   origin: "http://localhost:25010",
    //   credentials: true,
    // })
);

app.use(cookieParser());
app.use(customExtensions())

app.use(function (error: any, req: any, res: any, next: any) {
    /* #swagger.security = [{
      "bearerAuth": []
  }] */
});
app.get("/", async (req: Request, res: Response) => {
    return res.sendFile('index.html', { root: path.join(__dirname, './public') })
});
app.use("/login", loginRoute);
app.use("/account", accountRoute);
app.use("/school", schoolRoute);
app.use("/general", generalRoute);

const httpServer = app.listen((process.env.PORT || config.PORT), () => {
    logger.info("Backoffice Server started at http://localhost:" + (process.env.PORT || config.PORT));
    console.log("Backoffice Server started at http://localhost:" + (process.env.PORT || config.PORT));
});

export {
    httpServer,
    app,
}

