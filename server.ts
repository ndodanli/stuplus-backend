import customExtensions from "../stuplus-lib/extensions/extensions";
import "../stuplus-lib/extensions/extensionMethods"
import express, { Request, Response, } from "express";
import { initializeDatabese } from "./config/database";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import loginRoute from "./routes/loginRoute";
import accountRoute from "./routes/accountRoute";
import schoolRoute from "./routes/schoolRoute";
import announcementRoute from "./routes/announcementRoute";
import questionRoute from "./routes/questionRoute";
import searchRoute from "./routes/searchRoute";
import generalRoute from "./routes/generalRoute";
import chatRoute, { initializeSocket } from "./socket/index";
import swaggerRoute from "./routes/swaggerRoute";
import path from "path";
import interestRoute from "./routes/interestRoute";
import logger, { setLogger } from "../stuplus-lib/config/logger";
import { initializeRedis } from "../stuplus-lib/services/redisService";

dotenv.config();

const app = express();
setup();
setLogger("Stuplus API-SOCKET");
async function setup() {
  await initializeDatabese();
  await initializeRedis();
  await initializeSocket();
  await import("./cron/index");
  app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
  app.use(bodyParser.json({ limit: "50mb" }));

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
    next();
  });
  app.get("/", async (req: Request, res: Response) => {
    return res.sendFile('index.html', { root: path.join(__dirname, './public') })
  });
  app.use("/account", accountRoute);
  app.use("/login", loginRoute);
  app.use("/school", schoolRoute);
  app.use("/interest", interestRoute);
  app.use("/announcement", announcementRoute);
  app.use("/question", questionRoute);
  app.use("/search", searchRoute);
  app.use("/general", generalRoute);
  app.use("/chat", chatRoute);

  app.use("/doc", swaggerRoute);


  app.listen((process.env.PORT), () => {
    logger.info("API-SOCKET Server started at http://localhost:" + (process.env.PORT));
    console.log("API-SOCKET Server started at http://localhost:" + (process.env.PORT));
    import("./socket/index");
  });
}

export {
  app,
}



