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
import swaggerRoute from "./routes/swaggerRoute";
import path from "path";
import { config } from "./config/config";
import interestRoute from "./routes/interestRoute";
import customExtensions from "../stuplus-lib/extensions/extensions";

dotenv.config();

const app = express();

setup();

async function setup() {
  await initializeDatabese();
  CronService.init();

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

app.get("/", async (req: Request, res: Response) => {
  return res.sendFile('index.html', { root: path.join(__dirname, './public') })
});
app.use("/account", accountRoute);
app.use("/login", loginRoute);
app.use("/school", schoolRoute);
app.use("/interest", interestRoute);
app.use("/announcement", announcementRoute);

app.use("/doc", swaggerRoute);

const httpServer = app.listen((process.env.PORT || config.PORT), () => console.log("Server started at http://localhost:" + (process.env.PORT || config.PORT)));

export {
  httpServer,
  app
}

import "./socket/index";
import CronService from "./services/cronService";
