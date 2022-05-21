import express, { Request, Response, } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import path from "path";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer);

app.use(
  cors()
  // cors({
  //   origin: "http://localhost:25010",
  //   credentials: true,
  // })
);

app.get("/", async (req: Request, res: Response) => {
  return res.sendFile('index.html', { root: path.join(__dirname, './public') })
});

app.get("/test.js", async (req: Request, res: Response) => {
  return res.sendFile('test.js', { root: path.join(__dirname, './public') })
});

io.on("connection", (socket) => {
  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });
  // console.log("server: ", socket.id);
  // console.log("server: ", socket.handshake.query.test);
  try {
    test()
  } catch (error: any) {
    console.log(error?.message)
    io.to(socket.id)?.emit("conError", { hasError: true, error: error.message });
    socket.disconnect();
  }
});

function test() {
  throw new Error("dsads");
}

httpServer.listen(3000, () => console.log("Server started at http://localhost:" + 3000));
