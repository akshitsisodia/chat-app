import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import { CALL_STATE } from "../config/callState";
import { getSocket } from "../Lib/socket";
import IncomingCall from "../Components/ui/IncomingCall";
import CallingScreen from "../Components/ui/CallingScreen";

import "../Styles/VideoCall.css";
import { useSocket } from "./SocketContext";

const CallContext = createContext();

const initialState = {
    status: CALL_STATE.IDLE,
    peer: null,
    offer: null,
    callType: "audio",
    notify: true
};

function callReducer(state, action) {
    switch (action.type) {
        case "OUTGOING":
            return { ...state, status: CALL_STATE.OUTGOING, peer: action?.peer };

        case "CONNECTING":
            return { ...state, status: CALL_STATE.CONNECTING };

        case "INCOMING":
            return { ...state, status: CALL_STATE.RINGING, peer: action?.peer, offer: action.offer, callType: action.callType };

        case "REJECTED":
            return { ...state, status: CALL_STATE.REJECTED };

        case "TIMEOUT":
            return { ...state, status: CALL_STATE.TIMEOUT };

        case "ACCEPT":
            return { ...state, status: CALL_STATE.CONNECTING };

        case "CONNECTED":
            return { ...state, status: CALL_STATE.CONNECTED };



        case "END":
            return { ...state, status: CALL_STATE.ENDED };

        case "RESET":
            return { status: CALL_STATE.IDLE, peer: null, offer: null, notify: true };

        default:
            return state;
    }
}


export const CallProvider = ({ children }) => {
    const { socket } = useSocket();
    const [state, dispatch] = useReducer(callReducer, initialState);

    const localStream = useRef(null);
    const myVideo = useRef(null);
    const remoteVideo = useRef(null);

    const pendingCandidates = useRef([]);

    const pc = useRef(new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" } // free STUN
        ]
    }));

    // const [incomingCall, setIncomingCall] = useState(null);

    const getMedia = async (video) => {
        const needNewStream =
            !localStream.current ||
            localStream.current.getVideoTracks().length !== (video ? 1 : 0);

        if (needNewStream) {
            // stop old stream
            if (localStream.current) {
                localStream.current.getTracks().forEach(t => t.stop());
            }

            localStream.current = await navigator.mediaDevices.getUserMedia({
                video: video,
                audio: true,
            });
        }

        return localStream.current;
    };

    //actions
    const callUser = async (user, video = false) => {
        if (pc.current) {
            pc.current.close();
        }
        pc.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        dispatch({ type: "OUTGOING", peer: user });

        // Get camera + mic
        const stream = await getMedia(video);

        // Attach to UI  
        myVideo.current.srcObject = stream;


        // console.log(localStream.current);
        // console.log(localStream.current?.getTracks().map(t => t.kind));

        // Add stream to connection (pc "peerConnection")
        stream.getTracks().forEach(track => {
            const alreadyAdded = pc.current
                .getSenders()
                .some(sender => sender.track === track);

            if (!alreadyAdded) {
                pc.current.addTrack(track, stream);
            }
        });

        pc.current.ontrack = (event) => {
            console.log("ontrack fired", event.streams);
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = event.streams[0];
            }
        };

        // ICE 
        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.emit("ice-candidate", {
                    to: user.id,
                    candidate: event.candidate,
                });
            }
        };

        // Create OFFER = "i want to start a call"
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);

        // dispatch({ type: "CONNECTING" });

        // Send offer 
        socket?.emit("call-user", {
            to: user.id,
            offer,
            type: video ? "video" : "audio"
        });
    }

    const acceptCall = async () => {
        dispatch({ type: "ACCEPT" });

        const stream = await getMedia();

        myVideo.current.srcObject = stream;

        // add tracks
        stream.getTracks().forEach(track => {
            pc.current.addTrack(track, stream);
        });

        // set handlers (ideally set once when pc is created)
        pc.current.ontrack = (event) => {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = event.streams[0];
            }
        };



        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.emit("ice-candidate", {
                    to: state.peer.id,
                    candidate: event.candidate,
                });
            }
        };

        // offer
        await pc.current.setRemoteDescription(state?.offer);

        // apply queued ICE
        for (const c of pendingCandidates.current) {
            await pc.current.addIceCandidate(c);
        }
        pendingCandidates.current.length = 0;


        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);

        const stats = await pc.current.getStats();

        // stats.forEach(report => {
        //     if (report.type === "inbound-rtp" && report.kind === "video") {
        //         console.log("Video packets received:", report.packetsReceived);
        //     }
        // })

        dispatch({ type: "CONNECTED" });

        socket?.emit("answer-call", {
            to: state.peer.id,
            answer,
        });
    }

    function rejectCall() {
        if (state.status === CALL_STATE.RINGING) {
            socket?.emit("reject-call", { to: state?.peer?.id });
            endCall("RESET", false);
        }
    }

    function endCall(reason = "END", notify = true) {

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

            // IMPORTANT: recreate for next call
            pc.current = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" }
                ]
            });
        }

        // 4. Clear ICE queue
        pendingCandidates.current.length = 0;

        // 5. Reset UI
        dispatch({ type: reason });

        // 6. Notify other user
        if (notify && state?.peer?.id) {
            socket?.emit("end-call", { to: state.peer.id });
        }
    }

    // ---- socket handlers ----

    const handleIce = async ({ candidate }) => {
        if (state.status !== CALL_STATE.RINGING &&
            state.status !== CALL_STATE.CONNECTING &&
            state.status !== CALL_STATE.CONNECTED) {
            return
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
    const handleIncoming = async ({ from, user, offer, type }) => {
        console.log("Works")
        dispatch({ type: "INCOMING", peer: user, offer: offer, callType: type });
    }



    const handleAccepted = async ({ answer }) => {
        if (state.status !== CALL_STATE.OUTGOING) {
            return;
        }
        dispatch({ type: "CONNECTING" })

        const pcInstance = pc.current;

        // 1. Guard: connection must exist and be open
        if (!pcInstance || pcInstance.signalingState === "closed") {
            console.warn("PeerConnection is closed or missing");
            return;
        }


        try {
            // Ensure remote stream handler
            pcInstance.ontrack = (event) => {
                if (remoteVideo.current) {
                    remoteVideo.current.srcObject = event.streams[0];
                }
            };

            // 2. Avoid setting remote description twice
            if (!pcInstance.remoteDescription) {
                await pcInstance.setRemoteDescription(answer);
            }

            // Now we are actually connecting
            dispatch({ type: "CONNECTING" });

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

            const stats = await pc.current.getStats();

            dispatch({ type: "CONNECTED" });
        } catch (err) {
            console.error("Error in handleAccepted:", err);
        }
    };
    const handleRejected = async () => {
        if (state.status === CALL_STATE.OUTGOING || state.status === CALL_STATE.CONNECTING) {
            endCall("REJECTED", false);
        };
    }

    function handleEndCall() {
        dispatch({ type: "END" });
    }

    useEffect(() => {
        if (!socket) return;

        socket.on("ice-candidate", handleIce);
        socket.on("incoming-call", handleIncoming);

        socket.on("call-accepted", handleAccepted);
        socket.on("call-rejected", handleRejected);

        socket.on("end-call", handleEndCall);

        return () => {
            socket.off("ice-candidate", handleIce);
            socket.off("incoming-call", handleIncoming);

            socket.off("call-accepted", handleAccepted);
            socket.off("call-rejected", handleRejected);

            socket.off("end-call", handleEndCall);
        };

    }, [socket, state.status])

    useEffect(() => {
        let timer;

        const delayMap = {
            [CALL_STATE.REJECTED]: 2000,
            [CALL_STATE.ENDED]: 1000,
            [CALL_STATE.TIMEOUT]: 2000,
        };

        const delay = delayMap[state.status];

        if (delay) {
            timer = setTimeout(() => {
                endCall("RESET", false);
            }, delay);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [state.status]);

    // timeout 
    useEffect(() => {
        if (state.status === CALL_STATE.RINGING || state.status === CALL_STATE.OUTGOING) {
            const timer = setTimeout(() => {
                dispatch(state.status === CALL_STATE.RINGING ? { type: "END" } : { type: "TIMEOUT" });
            }, 30000); // 30s timeout
            return () => clearTimeout(timer);
        }
    }, [state.status]);

    // useEffect(() => {
    //     if (state.status === CALL_STATE.RINGING) {
    //         // audio + vibration
    //         startRinging();
    //     } else {
    //         stopRinging();
    //     }
    // }, [state.status]);

    return (
        <CallContext.Provider value={{ state, callUser, acceptCall, rejectCall }}>
            {children}

            {/* GLOBAL UI */}
            {state.status === CALL_STATE.RINGING && <IncomingCall caller={state?.peer} isVideo={state?.callType === "video" ? true : false} acceptCall={acceptCall} rejectCall={rejectCall} />}
            {/* {state.status === CALL_STATE.CONNECTED && <VideoCallUI />} */}

            {(state.status === CALL_STATE.OUTGOING || state.status === CALL_STATE.CONNECTING)
                &&
                <CallingScreen myVideo={myVideo} remoteVideo={remoteVideo} endCall={endCall} />
            }

            {state.status === CALL_STATE.CONNECTED && <CallingScreen myVideo={myVideo} remoteVideo={remoteVideo} endCall={endCall} isCalling={false} />}

        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext)