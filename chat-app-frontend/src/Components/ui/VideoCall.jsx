import { FaMicrophoneSlash, FaPhone, FaPhoneAlt, FaPhoneSlash, FaPhoneSquareAlt, FaPhoneVolume, FaVideo, FaVideoSlash, FaVolumeMute } from "react-icons/fa";
import "../../Styles/VideoCall.css"
import { useEffect, useRef, useState } from "react";
import { FaGear, FaMaximize, FaMicrophoneLines, FaMinimize, FaPhoneFlip, FaVolumeHigh } from "react-icons/fa6";

export default function VideoCall({ socket, userId }) {
    const myVideo = useRef();
    const remoteVideo = useRef(null);
    const localStream = useRef(null);
    const callState = useRef("idle"); // "idle" | "ringing" | "connected" | "calling" | "rejected"

    const audioRef = useRef(null);
    const vibrationRef = useRef(null);

    const [isCalling, setIsCalling] = useState(false);
    const [isMaximize, setIsMaximize] = useState(false)

    const [incomingCall, setIncomingCall] = useState(null);



    const pc = useRef(new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" } // free STUN
        ]
    }));

    const pendingCandidates = useRef([]);

    // 1. Start Call
    const startCall = async () => {
        callState.current = "connected"
        setIsCalling(true)
        // Get camera + mic 
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        localStream.current = stream;

        // Attach to UI  
        myVideo.current.srcObject = stream;

        // Add stream to connection (pc)
        stream.getTracks().forEach(track => {
            pc.current.addTrack(track, stream);
        });

        pc.current.ontrack = (event) => {
            remoteVideo.current.srcObject = event.streams[0];
        };

        //send ICE candidate for connection
        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    to: userId,
                    candidate: event.candidate,
                });
            }
        };

        // Create OFFER = "i want to start a call"
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);

        // Send offer 
        socket.emit("call-user", {
            to: userId,
            offer,
        });
    };

    const acceptCall = async () => {
        callState.current = "connected";
        const { from, offer } = incomingCall;

        const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
        });

        localStream.current = stream;

        if (myVideo.current) {
            myVideo.current.srcObject = stream;
        }

        stream.getTracks().forEach(track => {
            pc.current.addTrack(track, stream);
        });

        pc.current.ontrack = (event) => {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = event.streams[0];
            }
        };

        await pc.current.setRemoteDescription(offer);

        for (const c of pendingCandidates.current) {
            await pc.current.addIceCandidate(c);
        }
        pendingCandidates.current.length = 0;

        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);

        socket.emit("answer-call", {
            to: from,
            answer,
        });

        setIncomingCall(null);
    };

    const rejectCall = () => {
        if (incomingCall) {
            socket.emit("reject-call", {
                to: incomingCall.from,
            });
        }
        callState.current = "idle";
        pendingCandidates.current = [];

        setIncomingCall(null);
        setIsCalling(false);

        setIncomingCall(null);
        setIsCalling(false);
    };

    useEffect(() => {
        const handleIce = async ({ candidate }) => {
            if (callState.current !== "connected" && callState.current !== "ringing") {
                return;
            }
            try {
                if (pc.current.remoteDescription) {
                    await pc.current.addIceCandidate(candidate);
                } else {
                    pendingCandidates.current.push(candidate);
                }
            } catch (err) {
                console.error(err);
            }
        };

        const handleIncoming = async ({ from, user, offer }) => {
            callState.current = "ringing";
            setIncomingCall({ from, user, offer });
            setIsCalling(true);
        };


        const handleAccepted = async ({ answer }) => {
            if (callState.current !== "connected") {
                return;
            }
            const pcInstance = pc.current;

            // 1. Guard: connection must exist and be open
            if (!pcInstance || pcInstance.signalingState === "closed") {
                console.warn("PeerConnection is closed or missing");
                return;
            }

            try {
                // 2. Avoid setting remote description twice
                if (!pcInstance.remoteDescription) {
                    await pcInstance.setRemoteDescription(answer);
                }

                // 3. Flush ICE queue safely
                for (const c of pendingCandidates.current) {
                    try {
                        await pcInstance.addIceCandidate(c);
                    } catch (err) {
                        console.warn("Failed to add ICE candidate", err);
                    }
                }

                // 4. Clear queue properly
                pendingCandidates.current.length = 0;

            } catch (err) {
                console.error("Error in handleAccepted:", err);
            }
        };


        const handleEndCall = () => {
            endCall();
        };

        socket.on("call-rejected", () => {
            console.log("Call rejected");
            endCall();
        });
        socket.on("incoming-call", handleIncoming);
        socket.on("call-accepted", handleAccepted);
        socket.on("ice-candidate", handleIce);
        socket.on("end-call", handleEndCall);

        return () => {
            socket.off("incoming-call", handleIncoming);
            socket.off("call-accepted", handleAccepted);
            socket.off("ice-candidate", handleIce);
            socket.off("end-call", handleEndCall);
        };
    }, []);



    const endCall = () => {
        // 1. Stop local media (camera + mic)
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }

        // 2. Clear video elements
        if (myVideo.current) {
            myVideo.current.srcObject = null;
        }

        if (remoteVideo.current) {
            remoteVideo.current.srcObject = null;
        }

        // 3. Close peer connection
        if (pc.current) {
            pc.current.ontrack = null;
            pc.current.onicecandidate = null;
            pc.current.close();

            // 🔁 IMPORTANT: recreate for next call
            pc.current = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" }
                ]
            });
        }

        // 4. Reset UI
        setIsCalling(false);
        callState.current = "idle"

        // 5. Notify other user
        socket.emit("end-call", { to: userId });
    };



    useEffect(() => {
        audioRef.current = new Audio("../../../public/sound/ringtone.mp3");
        audioRef.current.loop = true;
    }, []);

    useEffect(() => {
        if (callState.current === "ringing") {
            audioRef.current?.play().catch(() => { });
        } else {
            audioRef.current?.pause();
            if (audioRef.current) audioRef.current.currentTime = 0;
        }
    }, [callState.current]);

    function stopVibration() {
        if (vibrationRef.current) {
            clearInterval(vibrationRef.current);
            vibrationRef.current = null;
        }
        navigator.vibrate(0);
    }

    useEffect(() => {
        if (callState.current === "ringing") {
            if ("vibrate" in navigator) {
                vibrationRef.current = setInterval(() => {
                    navigator.vibrate([300, 200, 300]);
                }, 1000);
            }
        } else {
            stopVibration();
        }

        return () => stopVibration();
    }, [callState.current]);


    return (
        <div>
            <button className="stream-button" onClick={startCall}><FaVideo color="var(--primary-color)" /></button>

            {callState.current === "ringing" &&
                <div className="incoming-call">
                    <div className="incomong-call-user">
                        <img src={incomingCall?.user?.photo} alt={incomingCall?.user?.name} />
                        {/* <p>{incomingCall?.user?.email}</p> */}
                        <h3>{incomingCall?.user?.name}</h3>
                        <p>is now video calling...</p>
                    </div>
                    <div className="incoming-call-buttons">
                        <button
                            type="button"
                            onClick={rejectCall}
                            className="reject-call incoming-button"
                        >
                            {/* <FaPhoneSlash style={{ transform: "scaleX(-1)" }} /> */}
                            <FaVideoSlash />
                            <p>Reject</p>
                        </button>
                        <button
                            type="button"
                            onClick={acceptCall}
                            className="accept-call incoming-button">
                            {/* <FaPhone style={{ transform: "scaleX(-1)" }} /> */}
                            <FaVideo />
                            <p>Accept</p>

                        </button>
                    </div>
                </div>
            }
            {isCalling && callState.current !== "ringing" &&
                <div className="videocall-interface-main">
                    <button className="videocall-volume-button"><FaVolumeHigh /></button>
                    <div className="videocall-interface-buttons">
                        <button
                            type="button"
                            className="videocall-other-button"
                            onClick={() => isMaximize ? setIsMaximize(false) : setIsMaximize(true)}
                        >
                            {isMaximize ? <FaMaximize /> : <FaMinimize />}
                        </button>
                        <button className="videocall-other-button" onClick={endCall}><FaMicrophoneSlash /></button>
                        <button className="videocall-end-button" onClick={endCall}><FaPhoneSlash /></button>
                        <button className="videocall-other-button" onClick={endCall}><FaVideo /></button>
                        <button className="videocall-other-button" onClick={endCall}><FaGear /></button>
                    </div>
                </div>
            }
            <button
                type="button"
                onClick={isMaximize ? () => { } : () => isMaximize ? setIsMaximize(false) : setIsMaximize(true)}
                className={isCalling && callState.current !== "ringing" ? (isMaximize ? "videocall-max" : "videocall-min") : "videocall-hidden"}
            >
                <video ref={myVideo} autoPlay muted />
            </button>
            <button
                type="button"
                onClick={!isMaximize ? () => { } : () => isMaximize ? setIsMaximize(false) : setIsMaximize(true)}
                className={isCalling && callState.current !== "ringing" ? (!isMaximize ? "videocall-max" : "videocall-min") : "videocall-hidden"}
            >
                <video ref={remoteVideo} autoPlay />
            </button>
        </div>
    );
}