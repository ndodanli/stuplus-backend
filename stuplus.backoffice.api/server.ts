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
import facultyRoute from "./routes/facultyRoute";
import departmentRoute from "./routes/departmentRoute";
import interestRoute from "./routes/interestRoute";
import announcementRoute from "./routes/announcementRoute";
import announcementLikeRoute from "./routes/announcementLikeRoute";
import announcementCommentRoute from "./routes/announcementCommentRoute";
import questionCommentRoute from "./routes/questionCommentRoute";
import questionLikeRoute from "./routes/questionLikeRoute";
import questionCommentLikeRoute from "./routes/questionCommentLikeRoute";
import announcementCommentLikeRoute from "./routes/announcementCommentLikeRoute";
import questionRoute from "./routes/questionRoute";
import userRoute from "./routes/userRoute";
import generalRoute from "./routes/generalRoute";
import path from "path";
import { config } from "./config/config";
import customExtensions from "../stuplus-lib/extensions/extensions";
import { setLogger } from "../stuplus-lib/config/logger";

dotenv.config({ path: ".env" });

const app = express();

setup();

async function setup() {
    setLogger("Stuplus Backoffice API");
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
app.use("/faculty", facultyRoute);
app.use("/department", departmentRoute);
app.use("/interest", interestRoute);
app.use("/announcement", announcementRoute);
app.use("/announcementLike", announcementLikeRoute);
app.use("/announcementComment", announcementCommentRoute);
app.use("/announcementCommentLike", announcementCommentLikeRoute);
app.use("/question", questionRoute);
app.use("/questionLike", questionLikeRoute);
app.use("/questionComment", questionCommentRoute);
app.use("/questionCommentLike", questionCommentLikeRoute);
app.use("/user", userRoute);
app.use("/general", generalRoute);

const httpServer = app.listen((process.env.PORT || config.PORT), () => {
    logger.info("Backoffice Server started at http://localhost:" + (process.env.PORT || config.PORT));
    console.log("Backoffice Server started at http://localhost:" + (process.env.PORT || config.PORT));
});

export {
    httpServer,
    app,
}

