$(document).ready(function () {
    const msgerForm = get(".msger-inputarea");
    const msgerInput = get(".msger-input");
    const msgerChat = get(".msger-chat");

    const BOT_IMG = "https://thumbs.dreamstime.com/b/closeup-photo-funny-excited-lady-raise-fists-screaming-loudly-celebrating-money-lottery-winning-wealthy-rich-person-wear-casual-172563278.jpg";
    const PERSON_IMG = "https://image.shutterstock.com/image-photo/image-serious-confident-dark-skinned-260nw-1417352750.jpg";
    const BOT_NAME = "Person 1";
    const PERSON_NAME = "Person 2";
    const USER_ID = "62b4452d65b0d1e0f64e0881";

    msgerForm.addEventListener("submit", event => {
        event.preventDefault();

        const msgText = msgerInput.value;
        if (!msgText) return;

        appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
        // msgerInput.value = "";
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        for (let u = 0; u < 10000; u++) {
            socket.emit("pm-send", {
                to: USER_ID,
                m: msgText,
                // ci: "dasds"
                // + Math.random() * 10000
            }, (res) => {
                console.log("response: ", res);
                socket.emit("pm-forwarded", {
                    to: USER_ID,
                    mids: [res.mi],
                    ci: "dasds"
                }, (res) => {
                    console.log("response: ", res);
                });

                socket.emit("pm-readed", {
                    to: USER_ID,
                    mids: [res.mi],
                    ci: "dasds"
                }, (res) => {
                    console.log("response: ", res);
                });
            });
            sleep(5);
        }
        for (let u = 0; u < 1; u++) {
            socket.emit("gm-send", {
                gCi: "62a8db3451e63a44bfcc8116",
                m: msgText,
                // ci: "dasds"
                // + Math.random() * 10000
            }, (res) => {
                console.log("response: ", res);
                socket.emit("gm-forwarded", {
                    gCi: "62a8db3451e63a44bfcc8116",
                    mids: [res.mi],
                }, (res) => {
                    console.log("response: ", res);
                });

                socket.emit("gm-readed", {
                    gCi: "62a8db3451e63a44bfcc8116",
                    mids: [res.mi],
                }, (res) => {
                    console.log("response: ", res);
                });
            });
            sleep(1);
        }
    });
    socket.on("c-pm-send", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `c-pm-send: ${JSON.stringify(data)}`);
    });
    socket.on("c-pm-forwarded", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `c-pm-forwarded: ${JSON.stringify(data)}`);
    });
    socket.on("c-pm-readed", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `c-pm-readed: ${JSON.stringify(data)}`);
    });
    socket.on("c-group-created", data => {
        console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `c-group-created: ${JSON.stringify(data)}`);
    });
    socket.on("c-gm-send", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `c-gm-send: ${JSON.stringify(data)}`);
    });
    socket.on("c-gm-forwarded", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `c-gm-forwarded: ${JSON.stringify(data)}`);
    });
    socket.on("c-gm-readed", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `c-gm-readed: ${JSON.stringify(data)}`);
    });
    socket.on("c-watch-users", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `c-watch-users: ${JSON.stringify(data)}`);
    });
    function appendMessage(name, img, side, text) {
        //   Simple solution for small apps
        const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

        msgerChat.insertAdjacentHTML("beforeend", msgHTML);
        msgerChat.scrollTop += 500;
    }

    // Utils
    function get(selector, root = document) {
        return root.querySelector(selector);
    }

    function formatDate(date) {
        const h = "0" + date.getHours();
        const m = "0" + date.getMinutes();

        return `${h.slice(-2)}:${m.slice(-2)}`;
    }

    function random(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

});

const baseUrl = "http://localhost:25010";
axios.defaults.baseURL = baseUrl;
axios.defaults.headers.common["Authorization"] = "Bearer " +
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MjhhOWUzOWI0ODNmNDI4YTc0ZTc1YzEiLCJyb2xlIjoxLCJpYXQiOjE2NTUwNTI1NzUsImV4cCI6MTY1NzY0NDU3NX0.XlFb0hC3xds8M1hSJpz5N08RxFFg3vYkC6sAp24Algo";
async function createGroup() {
    const { data } = await axios.post("/chat/createGroup",
        {
            title: "test group name",
            userIds: ["628a9e39b483f428a74e75c1", "628a9e39b483f428a74e75c2"],
            type: 0
        })
}
async function watchUsers() {
    socket.emit("watch-users", {
        uIds: ["628a9e39b483f428a74e75c1", "62aa35971c1df0aaea949dfe"]
    }, (res) => {
        console.log("response: ", res);
    });
}