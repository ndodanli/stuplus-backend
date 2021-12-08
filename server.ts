import express, { Request, Response, } from "express";
import { initializeDatabese } from "./config/database";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import loginRoute from "./routes/loginRoute";
import accountRoute from "./routes/accountRoute";
import schoolRoute from "./routes/schoolRoute";

import swaggerRoute from "./routes/swaggerRoute";
import path from "path";

dotenv.config();

const app = express();

initializeDatabese();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  cors()
  // cors({
  //   origin: "http://localhost:3000",
  //   credentials: true,
  // })
);

app.use(cookieParser());

app.get("/", async (req: Request, res: Response) => {
  return res.sendFile('index.html', { root: path.join(__dirname, './public') })
});
app.use("/account", accountRoute);
app.use("/login", loginRoute);
app.use("/school", schoolRoute);

app.use("/doc", swaggerRoute);

app.listen(process.env.PORT, () => console.log("Server started at http://localhost:" + process.env.PORT));
