import express from "express";
import { initializeDatabese } from "./config/database";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import loginRoute from "./routes/loginRoute"
import accountRoute from "./routes/accountRoute"

dotenv.config();

const app = express();

initializeDatabese()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(
  cors()
  // cors({
  //   origin: "http://localhost:3000",
  //   credentials: true,
  // })
);

app.use(cookieParser());

app.use("/account", accountRoute);
app.use("/login", loginRoute);

app.listen(process.env.PORT, () => console.log("Server started at http://localhost:" + process.env.PORT));
