import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import { CALL_STATE } from "../config/callState";
import { getSocket } from "../Lib/socket";
import IncomingCall from "../Components/ui/IncomingCall";
import CallingScreen from "../Components/ui/CallingScreen";

import "../Styles/VideoCall.css";
import { useSocket } from "./SocketContext";
import createPeerConnection from "../webrtc/peer";

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
            return { ...state, status: CALL_STATE.OUTGOING, peer: action?.peer, callType: action.callType };

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

    const [remoteStreams, setRemoteStreams] = useState({});
    const [isMuted, setIsMuted] = useState(false);
    const [isVideo, setIsVideo] = useState(false);

    const pendingCandidates = useRef(new Map());

    const peers = useRef(new Map());

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
        dispatch({ type: "OUTGOING", peer: user, callType: video ? "video" : "audio" });

        const pc = createPeerConnection({
            onTrack: (event) => {
                setRemoteStreams(prev => ({
                    ...prev,
                    [user.id]: event.streams[0]
                }));
            },
            onIce: (candidate) => {
                socket.emit("ice-candidate", {
                    to: user?.id,
                    candidate,
                });
            }
        });

        peers.current.set(user.id, pc)

        // Get camera + mic
        const stream = await getMedia(video);

        // Attach to UI  
        if (myVideo.current) {
            myVideo.current.srcObject = stream;
        }

        // Add stream to connection (pc "peerConnection")
        stream.getTracks().forEach(track => {
            const alreadyAdded = pc
                .getSenders()
                .some(sender => sender.track === track);

            if (!alreadyAdded) {
                pc.addTrack(track, stream);
            }
        });

        // Create OFFER = "i want to start a call"
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send offer 
        socket?.emit("call-user", {
            to: user.id,
            offer,
            type: video ? "video" : "audio"
        });
    }

    const acceptCall = async () => {
        dispatch({ type: "ACCEPT" });
        const pc = peers.current.get(state.peer.id);
        if (!pc) {
            console.warn("Peer not found");
            return;
        }

        const stream = await getMedia(state.callType === "video");

        if (myVideo.current) {
            myVideo.current.srcObject = stream;
        }

        // add tracks
        stream.getTracks().forEach(track => {
            const exists = pc.getSenders().some(s => s.track === track);
            if (!exists) {
                pc.addTrack(track, stream);
            }
        });

        await pc.setRemoteDescription(state.offer);

        const candidates = pendingCandidates.current.get(state.peer.id) || [];
        for (const c of candidates) {
            try {
                await pc.addIceCandidate(c);
            } catch (error) {
                console.warn("Failed to add ICE candidate", error);
            }
        }
        pendingCandidates.current.delete(state.peer.id);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

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

    const toggleMute = () => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMuted;
                setIsMuted(!isMuted);
            }
        }
    };
    const toggleVideo = () => {
        if (localStream.current) {
            const videotrack = localStream.current.getVideoTracks()[0];
            if (videotrack) {
                videotrack.enabled = isVideo;
                setIsVideo(!isVideo);
            }
        }
    };

    function endCall(reason = "END", notify = true) {

        // 1. Stop local media (camera + mic)
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }

        // Reset mute state when call ends
        setIsMuted(false);

        // 2. Clear video elements
        if (myVideo.current) {
            myVideo.current.srcObject = null;
        }

        setRemoteStreams({});

        // 3. Close peer connection
        peers.current.forEach((pc) => {
            pc.ontrack = null;
            pc.onicecandidate = null;
            pc.close();
        });
        peers.current.clear();

        // 4. Clear ICE queue
        pendingCandidates.current.clear();

        // 5. Reset UI
        dispatch({ type: reason });

        // 6. Notify other user
        if (notify && state?.peer?.id) {
            socket?.emit("end-call", { to: state.peer.id });
        }
    }

    // ---- socket handlers ----

    const handleIce = async ({ from, candidate }) => {
        // if (state.status !== CALL_STATE.RINGING &&
        //     state.status !== CALL_STATE.CONNECTING &&
        //     state.status !== CALL_STATE.CONNECTED) {
        //     return
        // }
        try {
            const pc = peers.current.get(from);
            if (!pc) return;
            // const pc = peers.current.values().next().value;
            if (!candidate) return;

            if (pc.remoteDescription) {
                await pc.addIceCandidate(candidate);
            } else {
                // pendingCandidates.current.push(candidate);
                if (!pendingCandidates.current.has(from)) {
                    pendingCandidates.current.set(from, []);
                }
                pendingCandidates.current.get(from).push(candidate);
            }
        } catch (err) {
            console.error("ICE error:", err);
        }
    };
    const handleIncoming = async ({ user, offer, type }) => {
        const pc = createPeerConnection({
            onTrack: (event) => {
                setRemoteStreams(prev => ({
                    ...prev,
                    [user.id]: event.streams[0]
                }));
            },
            onIce: (candidate) => {
                socket.emit("ice-candidate", {
                    to: user?.id,
                    candidate,
                });
            }
        });

        peers.current.set(user.id, pc)

        dispatch({
            type: "INCOMING",
            peer: user,
            offer,
            callType: type
        });
    };



    const handleAccepted = async ({ from, answer }) => {
        if (state.status !== CALL_STATE.OUTGOING) {
            return;
        }
        dispatch({ type: "CONNECTING" })

        const pcInstance = peers.current.get(from);
        // const pcInstance = peers.current.values().next().value;;

        // 1. Guard: connection must exist and be open
        if (!pcInstance || pcInstance.signalingState === "closed") {
            console.warn("PeerConnection is closed or missing");
            return;
        }

        try {
            // Ensure remote stream handler
            pcInstance.ontrack = (event) => {
                setRemoteStreams(prev => ({
                    ...prev,
                    [from]: event.streams[0]
                }))
            };

            // 2. Avoid setting remote description twice
            if (!pcInstance.remoteDescription) {
                await pcInstance.setRemoteDescription(answer);
            }

            // Now we are actually connecting
            dispatch({ type: "CONNECTING" });

            // 3. Flush ICE queue safely
            const candidates = pendingCandidates.current.get(from) || [];
            for (const c of candidates) {
                try {
                    await pcInstance.addIceCandidate(c);
                } catch (error) {
                    console.warn("Failed to add ICE candidate", error);
                }
            }
            pendingCandidates.current.delete(from);

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
    //         startRinging();
    //     } else {
    //         stopRinging();
    //     }
    // }, [state.status]);


    return (
        <CallContext.Provider value={{ state, callUser, acceptCall, rejectCall, endCall, myVideo, remoteStreams, isMuted, toggleMute, isVideo, toggleVideo }}>
            {children}

            {/* GLOBAL UI */}
            {state.status === CALL_STATE.RINGING && <IncomingCall caller={state?.peer} isVideo={state?.callType === "video" ? true : false} acceptCall={acceptCall} rejectCall={rejectCall} />}
            {/* {state.status === CALL_STATE.CONNECTED && <VideoCallUI />} */}

            {(state.status === CALL_STATE.OUTGOING || state.status === CALL_STATE.CONNECTING || state.status === CALL_STATE.CONNECTED)
                &&
                <CallingScreen isCalling={state.status === CALL_STATE.OUTGOING || state.status === CALL_STATE.CONNECTING ? true : false} isVideoCall={state?.callType === "video" ? true : false} />
            }

        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext)