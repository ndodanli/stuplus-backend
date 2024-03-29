$(document).ready(async function () {
    const baseUrl = "http://localhost:25010";
    axios.defaults.baseURL = baseUrl;
    axios.defaults.headers.common["Authorization"] = "Bearer " +
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MmU5NjA1YTZlYzNjNDBlYjA5YmFlYjMiLCJyb2xlIjoxLCJpYXQiOjE2NTk3Mjg4MTUsImV4cCI6MTY5MDgzMjgxNX0.yIBOEuj3r90dDYw4f9PkgsMWwFErHOwrMoRkr3WuNxM";
    const msgerForm = get(".msger-inputarea");
    const msgerInput = get(".msger-input");
    const msgerChat = get(".msger-chat");
    const { data } = await axios.get("/account/user");
    const { data: messageData } = await axios.post("/chat/getPMs", {
        chatId: "62c96f8cea5d4faa1448e904",
        pageSize: 20
    });

    const user = data.data;
    console.log("userid: ", user._id)
    const BOT_IMG = "https://thumbs.dreamstime.com/b/closeup-photo-funny-excited-lady-raise-fists-screaming-loudly-celebrating-money-lottery-winning-wealthy-rich-person-wear-casual-172563278.jpg";
    const PERSON_IMG = "https://image.shutterstock.com/image-photo/image-serious-confident-dark-skinned-260nw-1417352750.jpg";
    const BOT_NAME = "deneme45";
    const PERSON_NAME = user.username
    const USER_TO = "62ab8a204166fd1eaebbb3fa"; //ndodanli14
    console.log("messageData", messageData)
    const messages = messageData.data;
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (user._id == message.ownerId) {
            console.log(message)
            appendMessage(PERSON_NAME, PERSON_IMG, "right", message.text, message._id);
            $(`<span style="color:yellow;">sended</span>`).appendTo(`#${message._id}`);
            if (message.forwarded)
                $(`<span style="color:green;">forwarded</span>`).appendTo(`#${message._id}`);
            if (message.readed)
                $(`<span style="color:blue;">readed</span>`).appendTo(`#${message._id}`);
        }
        else {
            appendMessage(BOT_NAME, BOT_IMG, "left", message.text, message._id);

        }
    }
    const forwardMessages = messages.filter(x => x.ownerId != user._id && x.forwarded == false).map(x => x._id);
    const readMessages = messages.filter(x => x.ownerId != user._id && x.readed == false).map(x => x._id);
    socket.emit("pmForwarded", {
        to: USER_TO,
        ci: "62c96f8cea5d4faa1448e904"
    }, (res) => {
        console.log("response: ", res);
    });
    socket.emit("pmReaded", {
        to: USER_TO,
        ci: "62c96f8cea5d4faa1448e904"
    }, (res) => {
        console.log("response: ", res);
    });

    msgerForm.addEventListener("submit", event => {
        event.preventDefault();
        console.log("submit")
        const msgText = msgerInput.value;
        if (!msgText) return;
        // msgerInput.value = "";
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        socket.emit("pmSend", {
            to: USER_TO,
            t: msgText,
            ci: "62c96f8cea5d4faa1448e904"
            // + Math.random() * 10000
        }, (res) => {
            console.log("response: ", res);
            appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText, res.mi);

            $(`<span style="color:yellow;">sended</span>`).appendTo(`#${res.mi}`)
        });

        socket.emit("gmSend", {
            gCi: "62a8db3451e63a44bfcc8116",
            t: msgText
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
    });
    socket.on("cPmSend", data => {
        console.log("cPmSend: ", data);
        appendMessage(BOT_NAME, BOT_IMG, "left", data.t, data.mi);
    });
    socket.on("cPmForwarded", data => {
        const messageIds = data.mids;
        console.log('messageIds :', messageIds)
        messageIds.forEach(x => {
            $(`<span style="color:green;">forwarded</span>`).appendTo(`#${x}`)
        })
    });
    socket.on("cPmReaded", data => {
        const messageIds = data.mids;
        messageIds.forEach(x => {
            $(`<span style="color:blue;">readed</span>`).appendTo(`#${x}`)
        })
    });
    socket.on("cGroupCreated", data => {
        console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `cGroupCreated: ${JSON.stringify(data)}`);
    });
    socket.on("cGmSend", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `cGmSend: ${JSON.stringify(data)}`);
    });
    socket.on("cGmForwarded", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `cGmForwarded: ${JSON.stringify(data)}`);
    });
    socket.on("cGmReaded", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `cGmReaded: ${JSON.stringify(data)}`);
    });
    socket.on("cWatchUsers", data => {
        // console.log('data', data);
        appendMessage(BOT_NAME, BOT_IMG, "left", `cWatchUsers: ${JSON.stringify(data)}`);
    });
    function appendMessage(name, img, side, text, id) {
        //   Simple solution for small apps
        const msgHTML = `
    <div id="${id}" class="msg ${side}-msg">
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
async function markAsForwarded() {
    socket.emit("pmForwarded", {
        ci: "62c96f8cea5d4faa1448e904",
        to: "62ab8a204166fd1eaebbb3fa"
    }, (res) => {
        console.log("response: ", res);
    });
}