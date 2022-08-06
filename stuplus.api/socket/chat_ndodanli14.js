$(document).ready(async function () {
    const baseUrl = "http://localhost:25010";
    axios.defaults.baseURL = baseUrl;
    axios.defaults.headers.common["Authorization"] = "Bearer " +
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MmFiOGEyMDQxNjZmZDFlYWViYmIzZmEiLCJyb2xlIjowLCJpYXQiOjE2NTczNjc5NjIsImV4cCI6MTY4ODQ3MTk2Mn0.U3N6QR4fakNtpLHwEhkKpG3-Cf997Pwkb7Q4fsCbu1w";
    const msgerForm = get(".msger-inputarea");
    const msgerInput = get(".msger-input");
    const msgerChat = get(".msger-chat");
    const { data } = await axios.get("/account/user");
    const { data: messageData } = await axios.post("/chat/getPMs", {
        chatId: "62c96f8cea5d4faa1448e904",
        pageSize: 20
    });

    const user = data.data;
    const BOT_IMG = "https://thumbs.dreamstime.com/b/closeup-photo-funny-excited-lady-raise-fists-screaming-loudly-celebrating-money-lottery-winning-wealthy-rich-person-wear-casual-172563278.jpg";
    const PERSON_IMG = "https://image.shutterstock.com/image-photo/image-serious-confident-dark-skinned-260nw-1417352750.jpg";
    const BOT_NAME = "deneme45";
    const PERSON_NAME = user.username
    const USER_TO = "62ad8f706cc42f3e54e3d1e8"; //ndodanli14

    const messages = messageData.data;
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (user._id == message.ownerId) {
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
    $("#get-old-messages").on("click", async event => {
        await getOldMessages();
    });
    async function getOldMessages() {
        console.log("messages length before: ", messages.length)
        const { data: messageData } = await axios.post("/chat/getPMs", {
            lastRecordDate: messages[messages.length - 1].createdAt,
            chatId: "62c96f8cea5d4faa1448e904",
            pageSize: 20
        });
        console.log("lastRecordDate: ", messages[messages.length - 1].createdAt)
        const lastMessages = messageData.data;
        console.log("lastMessages length: ", lastMessages.length)
        for (let i = 0; i < lastMessages.length; i++) {
            const lastMessage = lastMessages[i];
            messages.push(lastMessage);
            if (user._id == lastMessage.ownerId) {
                appendMessage(PERSON_NAME, PERSON_IMG, "right", lastMessage.text, lastMessage._id, "afterbegin");
                $(`<span style="color:yellow;">sended</span>`).appendTo(`#${lastMessage._id}`);
                if (lastMessage.forwarded)
                    $(`<span style="color:green;">forwarded</span>`).appendTo(`#${lastMessage._id}`);
                if (lastMessage.readed)
                    $(`<span style="color:blue;">readed</span>`).appendTo(`#${lastMessage._id}`);
            }
            else {
                appendMessage(BOT_NAME, BOT_IMG, "left", lastMessage.text, lastMessage._id, "afterbegin");
            }
        }
        console.log("messages length after: ", messages.length)
    }

    msgerForm.addEventListener("submit", event => {
        event.preventDefault();

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


        // socket.emit("gm-send", {
        //     gCi: "62a8db3451e63a44bfcc8116",
        //     m: msgText,
        //     ci: "dasds"
        //     + Math.random() * 10000
        // }, (res) => {
        //     console.log("response: ", res);
        //     socket.emit("gm-forwarded", {
        //         gCi: "62a8db3451e63a44bfcc8116",
        //         mids: [res.mi],
        //     }, (res) => {
        //         console.log("response: ", res);
        //     });

        //     socket.emit("gm-readed", {
        //         gCi: "62a8db3451e63a44bfcc8116",
        //         mids: [res.mi],
        //     }, (res) => {
        //         console.log("response: ", res);
        //     });
        // });
    });
    socket.on("cPmSend", data => {
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
    function appendMessage(name, img, side, text, id, insertType = "beforeend") {
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

        msgerChat.insertAdjacentHTML(insertType, msgHTML);
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
        to: "62ad8f706cc42f3e54e3d1e8"
    }, (res) => {
        console.log("response: ", res);
    });
}