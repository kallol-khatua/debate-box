const switchMode = document.querySelector('button.mode-switch'),
    body = document.querySelector('body'),
    closeBtn = document.querySelector('.btn-close-right'),
    rightSide = document.querySelector('.right-side'),
    expandBtn = document.querySelector('.expand-btn');

switchMode.addEventListener('click', () => {
    body.classList.toggle('dark');
});
closeBtn.addEventListener('click', () => {
    rightSide.classList.remove('show');
    expandBtn.classList.add('show');
});
expandBtn.addEventListener('click', () => {
    rightSide.classList.add('show');
    expandBtn.classList.remove('show');
});

let localUserVideo;
let videoPlayer = document.getElementById("videoPlayer");
var vStream = null;
var aStream = null;
let mediaTrack;
let audioTrack;
let socketId;
let meetingId = window.location.search;
meetingId = meetingId.replace('?meetingId=', '');
let roomName = meetingId;
// let videoPlayer = document.getElementById("remote-video");
let peerVideo;
let peerAudio;
let peerConnection;
let muteBtn = document.getElementById("mute-btn")
let muteFlag = false;
let hideCamBtn = document.getElementById("hide-camera-btn")
let hideCamFlag = false;

function getCookie(name) {
    let matches = document.cookie.match(
        new RegExp(
            "(?:^|; )" +
            name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
            "=([^;]*)"
        )
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
}
let userData = JSON.parse(getCookie('user'));

let userId = userData._id;
// console.log(userId)
// console.log(userData)

let socket = io({ auth: { token: userId, meetingId: meetingId } });

var iceConfig = {
    iceServers: [
        {
            urls: "stun:stun.services.mozilla.com"
        },
        {
            urls: "stun:stun.l.google.com:19302"
        },
        {
            urls: "stun:stun1.l.google.com:19302"
        },
        {
            urls: "stun:stun2.l.google.com:19302"
        },
        {
            urls: "stun:stun3.l.google.com:19302"
        },
        {
            urls: "stun:stun4.l.google.com:19302"
        }
    ]
}

socket.on("ready", async (socketId) => {
    peerConnection = new RTCPeerConnection(iceConfig);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("candidate", event.candidate, socketId)
        }
    };

    peerConnection.ontrack = (event) => {

        if (event.track.kind == "video") {

            peerVideo = document.getElementById(`video_${socketId}`);

            peerVideo.srcObject = event.streams[0];
        }

        if (event.track.kind == "audio") {

            peerAudio = document.getElementById(`audio_${socketId}`);

            peerAudio.srcObject = event.streams[0];
        }
    };

    peerConnection.addTrack(mediaTrack, vStream);
    peerConnection.addTrack(audioTrack, aStream);

    peerConnection.createOffer(
        function (offer) {
            peerConnection.setLocalDescription(offer);

            socket.emit("offer", offer, socketId);
        },
        function (error) {
            console.log(error);
        }
    )

})

socket.on("candidate", async (candidate) => {

    var iceCandidate = new RTCIceCandidate(candidate);
    await peerConnection.addIceCandidate(iceCandidate);
})

socket.on("offer", (offer, socketId) => {

    peerConnection = new RTCPeerConnection(iceConfig);

    peerConnection.onicecandidate = peerConnection.onicecandidate = (event) => {
        if (event.candidate) {

            socket.emit("candidate", event.candidate, socketId)
        }
    };

    peerConnection.ontrack = (event) => {

        if (event.track.kind == "video") {

            peerVideo = document.getElementById(`video_${socketId}`);
            // console.dir(peerVideo)
            peerVideo.srcObject = event.streams[0];
        }

        if (event.track.kind == "audio") {
            peerAudio = document.getElementById(`audio_${socketId}`);
            // console.dir(peerAudio)
            peerAudio.srcObject = event.streams[0];
        }
    };

    peerConnection.addTrack(mediaTrack, vStream);
    peerConnection.addTrack(audioTrack, aStream);
    peerConnection.setRemoteDescription(offer);
    peerConnection.createAnswer(
        function (answer) {
            peerConnection.setLocalDescription(answer);
            socket.emit("answer", answer, socketId);
        },
        function (error) {
            console.log(error);
        }
    )
})

socket.on("answer", (answer) => {
    peerConnection.setRemoteDescription(answer);
})



socket.on("connect", () => {
    // console.log("connect");
    if (socket.id) {
        socketId = socket.id;
        localUserVideo = document.getElementById("localStream");
        socket.emit("join", roomName);
    }

})

socket.on("join", () => {
    // console.log("join");
    // processMedia();
    socket.emit("getConnectedUsers", roomName);
})

socket.on("connectedUser", (connectedUSer, host) => {

    let html = "";
    for (joineduser of connectedUSer) {

        html += `
            <div class="video-participant" id="${joineduser._id}">
                <p class="name-tag">${joineduser.username}</p>
                <video autoplay id="video_${joineduser.socket_id}" class="peer-video"></video>
                <audio autoplay id="audio_${joineduser.socket_id}" class="peer-audio"></audio>
            </div>`

    }

    videoPlayer.insertAdjacentHTML("afterbegin", html);
    if ((host._id.toString() != userId.toString()) && (host.meetingRoom == roomName)) {
        html = `
            <div class="video-participant" id="${host._id}">
                <p class="name-tag">${host.username}</p>
                <video autoplay id="video_${host.socket_id}" class="peer-video"></video>
                <audio autoplay id="audio_${host.socket_id}" class="peer-audio"></audio>
            </div>`;
        videoPlayer.insertAdjacentHTML("afterbegin", html);
    }

    processMedia();

})

//  ------------------------------------- chats -------------------------------------

socket.emit("getOldChats", roomName);
let chatArea = document.getElementById("chat-area");
socket.on("getOldChats", (chats) => {

    let html = "";
    chats.forEach(chat => {
        // console.log(chat)
        if (chat.sender == userId.toString()) {
            html += `
            <div class="message-wrapper reverse">
            
            <div class="message-content">
              
              <div class="message">${chat.message}</div>
            </div>
            </div>
            `
        }
        else {
            html += `
                <div class="message-wrapper">

                <div class="message-content">

                  <div class="message">${chat.message}</div>
                </div>
                </div>
                `
        }

    });
    chatArea.insertAdjacentHTML("afterbegin", html);
    chatArea.scrollTop = chatArea.scrollHeight;

})
function showChatArea() {
    observerNewChat.observe(document.getElementById("chat-area"));
    
}
const observerNewChat = new window.IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
        // Send a message to the server that the user has viewed the message.
        // console.log("observing")
        chatArea.scrollTop = chatArea.scrollHeight;
        return;
    }
}, {
    root: null,
    threshold: 0.1,
});


socket.on("loadCurrentChat", (chat) => {
    // console.log(chat);
    if(chat.roomName == roomName){
        html = `
                <div class="message-wrapper">

                <div class="message-content">

                  <div class="message">${chat.message}</div>
                </div>
                </div>
                `
    chatArea.insertAdjacentHTML("beforeend", html);
    chatArea.scrollTop = chatArea.scrollHeight;
    }
   
})

let messageField = document.getElementById("message-field");
messageField.addEventListener("keypress", (event) => {
    if (event.key == "Enter") {
        sendChat();
    }
});

function sendChat() {
    let message = messageField.value.trim();
    if (message == "") {
        messageField.value = "";
        return;
    }
    messageField.value = ""
    // console.log(message)

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/rooms/chats/saveChat", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    let chatData = {
        roomName: roomName,
        sender: userId,
        message: message,
    };

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    html = `
                    <div class="message-wrapper reverse">
        
                    <div class="message-content">

                      <div class="message">${response.data.message}</div>
                    </div>
                    </div>
                    `;
                    chatArea.insertAdjacentHTML("beforeend", html);
                    chatArea.scrollTop = chatArea.scrollHeight;
                    socket.emit("loadCurrentChat", roomName, response.data)

                } else {
                    console.log(response);
                }
            } else {
                alert("Error occurred while making the request");
            }
        }
    };
    // Send the request with the data
    let jsonData = JSON.stringify(chatData);
    xhr.send(jsonData);

}



//  ------------------------------------- chats -------------------------------------

socket.on('getOnlineUser', async (updatedUser) => {
    // console.log(updatedUser);
    if (updatedUser._id.toString() != userId.toString()) {
        html = `
            <div class="video-participant" id="${updatedUser._id}">
                <p class="name-tag">${updatedUser.username}</p>
                <video autoplay id="video_${updatedUser.socket_id}" class="peer-video"></video>
                <audio autoplay id="audio_${updatedUser.socket_id}" class="peer-audio"></audio>
            </div>`;
        videoPlayer.insertAdjacentHTML("afterbegin", html);
    } else {
        socket.emit("ready", roomName, socketId);
    }
});

socket.on('getOfflineUser', async (data) => {
    document.getElementById(data).remove();
});

// mute button functionality
muteBtn.addEventListener("click", () => {
    muteFlag = !muteFlag;
    if (muteFlag) { // when mute
        audioTrack.enabled = false;
        // muteBtn.innerText = "Unmute";
        muteBtn.style.backgroundColor = "rgba(103, 94, 94, 0.87)";
    } else { // when unmute
        audioTrack.enabled = true;
        // muteBtn.innerText = "Mute";
        muteBtn.style.backgroundColor = "white";
    }
})

// hide camera functionality
hideCamBtn.addEventListener("click", () => {
    hideCamFlag = !hideCamFlag;
    if (hideCamFlag) { // when camera is off
        mediaTrack.enabled = false;
        // hideCamBtn.innerText = "Show camera";
        hideCamBtn.style.backgroundColor = "rgba(103, 94, 94, 0.87)";
    } else { // when camera is on
        mediaTrack.enabled = true;
        // hideCamBtn.innerText = "Hide camera";
        hideCamBtn.style.backgroundColor = "white";
    }
})

// processing media data
async function processMedia() {
    try {

        aStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
        });

        vStream = await navigator.mediaDevices.getUserMedia({
            video: {
                height: 200,
                width: 350
            },
            audio: false
        });

        audioTrack = aStream.getAudioTracks()[0];
        audioTrack.enabled = true;

        mediaTrack = vStream.getVideoTracks()[0];
        localUserVideo.srcObject = new MediaStream([mediaTrack]);
        // console.log(vStream)
        // console.log(mediaTrack)
        // console.log(localUserVideo.srcObject)
        // socket.emit("ready", roomName, socketId);
        socket.emit("getOnlineUser", userId);

    } catch (error) {
        console.log(error);
    }
}