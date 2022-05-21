import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";
const SERVER_IP = "http://localhost:3000";
let socket = io(SERVER_IP, { query: "test=testtext" });
socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx


});

socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
});
socket.on("conError", (data) => {
    console.log(data)
})
// setTimeout(() => {
//     socket.disconnect()
//     console.log("disconnected")
// }, 1000);
// setTimeout(() => {
//     socket.connect(SERVER_IP);
// }, 2000);