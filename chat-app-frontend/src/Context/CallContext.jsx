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

        case "INCOMING":
            return { ...state, status: CALL_STATE.RINGING, peer: action?.peer, offer: action.offer, callType: action.callType };

        case "CONNECTING":
            return { ...state, status: CALL_STATE.CONNECTING };

        case "ACCEPT":
            return { ...state, status: CALL_STATE.CONNECTING };

        case "REJECTED":
            return { ...state, status: CALL_STATE.REJECTED };

        case "TIMEOUT":
            return { ...state, status: CALL_STATE.TIMEOUT };

        case "CONNECTED":
            return { ...state, status: CALL_STATE.CONNECTED };

        case "ONGOING":
            return { ...state, status: CALL_STATE.RECONNECTING };

        case "RECONNECTING":
            return { ...state, status: CALL_STATE.RECONNECTING, callType: action.callType };

        case "RECONNECTED":
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

    const myVideo = useRef(null);
    const localStream = useRef(null);
    const peers = useRef(new Map());
    const pendingCandidates = useRef(new Map());

    const [remoteStreams, setRemoteStreams] = useState({});
    const [isMuted, setIsMuted] = useState(false);
    const [isVideo, setIsVideo] = useState(false);

    const [callId, setCallId] = useState(null);
    const [participants, setParticipants] = useState([]); // userIds



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
        const newCallId = crypto.randomUUID();
        setCallId(newCallId);
        setParticipants([user.id]);

        dispatch({ type: "OUTGOING", peer: user, callType: video ? "video" : "audio" });

        const pc = createPeerConnection({
            onTrack: (event) => {
                setRemoteStreams(prev => ({ ...prev, [user.id]: event.streams[0] }));
            },
            onIce: (candidate) => {
                socket.emit("ice-candidate", {
                    to: user?.id,
                    candidate,
                    callId: newCallId
                });
            }
        });

        peers.current.set(user.id, pc)

        const stream = await getMedia(video);
        if (myVideo.current) myVideo.current.srcObject = stream;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket?.emit("call-user", {
            to: user.id,
            callId: newCallId,
            type: video ? "video" : "audio",
            offer,
        });
    };

    const acceptCall = async () => {
        dispatch({ type: "ACCEPT" });

        const pc = peers.current.get(state.peer.id);
        if (!pc) {
            console.warn("Peer not found");
            return;
        }

        const stream = await getMedia(state.callType === "video");

        if (myVideo.current) myVideo.current.srcObject = stream;

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
            callId
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
            socket?.emit("end-call", { to: state.peer.id, callId });
        }

        // 7. Clear localStorage
        localStorage.removeItem("ongoingCall");
    }

    // ---- socket handlers ----

    const handleIce = async ({ from, candidate, callId: incomingCallId }) => {
        if (incomingCallId !== callId) return;

        const pc = peers.current.get(from);
        if (!pc || !candidate) return;

        if (pc.remoteDescription) {
            await pc.addIceCandidate(candidate);
        } else {
            if (!pendingCandidates.current.has(from)) {
                pendingCandidates.current.set(from, []);
            }
            pendingCandidates.current.get(from).push(candidate);
        }

    };

    const handleIncoming = async ({ user, offer, type, callId }) => {
        setCallId(callId);
        setParticipants(prev => [...new Set([...prev, user.id])]);

        const pc = createPeerConnection({
            onTrack: (event) => {
                setRemoteStreams(prev => ({ ...prev, [user.id]: event.streams[0] }));
            },
            onIce: (candidate) => {
                socket.emit("ice-candidate", {
                    to: user?.id,
                    candidate,
                    callId
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
    const handleAccepted = async ({ from, answer, callId: incomingCallId }) => {
        console.log(callId, incomingCallId, "accepted")
        if (incomingCallId !== callId) return;

        const pc = peers.current.get(from);
        if (!pc) return;

        if (!pc || pc.signalingState === "closed") {
            console.warn("PeerConnection is closed or missing");
            return;
        }


        pc.ontrack = (event) => {
            setRemoteStreams(prev => ({
                ...prev,
                [from]: event.streams[0]
            }))
        };

        if (!pc.remoteDescription) {
            await pc.setRemoteDescription(answer);
        }

        dispatch({ type: "CONNECTING" });

        const candidates = pendingCandidates.current.get(from) || [];
        for (const c of candidates) {
            try {
                await pc.addIceCandidate(c);
            } catch (error) {
                console.warn("Failed to add ICE candidate", error);
            }
        }
        pendingCandidates.current.delete(from);

        dispatch({ type: "CONNECTED" });

    };

    const handleRejected = async () => {
        if (state.status === CALL_STATE.OUTGOING || state.status === CALL_STATE.CONNECTING) {
            endCall("REJECTED", false);
        };
    }

    const handleReconnect = async ({ participants, callType }) => {

        dispatch({ type: "RECONNECTING", callType });
        setParticipants(participants);

        const stream = await getMedia(callType === "video");
        if (myVideo.current) myVideo.current.srcObject = stream;

        const saved = JSON.parse(localStorage.getItem("ongoingCall"));
        if (!saved) return;


        for (const userId of participants) {
            if (peers.current.has(userId)) {
                peers.current.get(userId).close();
                peers.current.delete(userId);
            }

            const pc = createPeerConnection({
                onTrack: (event) => {
                    setRemoteStreams(prev => ({ ...prev, [userId]: event.streams[0] }));
                },
                onIce: (candidate) => {
                    socket.emit("ice-candidate", {
                        to: userId,
                        callId: saved.callId,
                        candidate,
                    });
                }
            });

            peers.current.set(userId, pc);

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("reconnect-offer", {
                to: userId,
                callId: saved.callId,
                offer,
            });
        }
    }

    const handleReconnectOffer = async ({ from, offer, callId: reconnectingCallId }) => {
        if (reconnectingCallId !== callId) return;

        // Clean old peer if exists
        if (peers.current.has(from)) {
            const oldPc = peers.current.get(from);
            oldPc.close();
            peers.current.delete(from);
        }

        const pc = createPeerConnection({
            onTrack: (event) => {
                setRemoteStreams(prev => ({ ...prev, [from]: event.streams[0] }));
            },
            onIce: (candidate) => {
                socket.emit("ice-candidate", {
                    to: from,
                    candidate,
                    callId
                });
            }
        });

        peers.current.set(from, pc);

        const stream = await getMedia(state.callType === "video");
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        await pc.setRemoteDescription(offer);

        const candidates = pendingCandidates.current.get(from) || [];
        for (const c of candidates) {
            try {
                await pc.addIceCandidate(c);
            } catch (error) {
                console.warn("Failed to add ICE candidate", error);
            }
        }
        pendingCandidates.current.delete(from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("reconnect-answer", {
            to: from,
            answer,
            callId
        });
    }

    const handleReconnectAnswer = async ({ from, answer, callId: reconnectingCallId }) => {
        if (reconnectingCallId !== callId) return;

        const pc = peers.current.get(from);
        if (!pc) return;

        await pc.setRemoteDescription(answer);

        const candidates = pendingCandidates.current.get(from) || [];
        for (const c of candidates) {
            try {
                await pc.addIceCandidate(c);
            } catch (error) {
                console.warn("Failed to add ICE candidate", error);
            }
        }
        pendingCandidates.current.delete(from);

        dispatch({ type: "RECONNECTED" });
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

        socket.on("reconnect-participants", handleReconnect);
        socket.on("reconnect-offer", handleReconnectOffer);
        socket.on("reconnect-answer", handleReconnectAnswer);

        socket.on("end-call", handleEndCall);

        return () => {
            socket.off("ice-candidate", handleIce);
            socket.off("incoming-call", handleIncoming);

            socket.off("call-accepted", handleAccepted);
            socket.off("call-rejected", handleRejected);

            socket.off("reconnect-participants", handleReconnect);
            socket.off("reconnect-offer", handleReconnectOffer);
            socket.off("reconnect-answer", handleReconnectAnswer);

            socket.off("end-call", handleEndCall);
        };

    }, [socket, state.status]);

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

    useEffect(() => {
        if (callId && (state.status === CALL_STATE.CONNECTED || state.status === CALL_STATE.RECONNECTED) && participants.length > 0) {
            localStorage.setItem("ongoingCall", JSON.stringify({
                callId,
                participants,
                callType: state.callType
            }));
        }
    }, [callId, state.status, participants]);

    useEffect(() => {
        if (!socket) return;

        const saved = JSON.parse(localStorage.getItem("ongoingCall"));
        if (!saved) return;


        setCallId(saved.callId);
        setParticipants(saved.participants);
        console.log(saved.callId)
        dispatch({ type: "ONGOING" })

        socket.emit("reconnect-call", {
            callId: saved.callId
        });
    }, [socket]);
    console.log(state)
    return (
        <CallContext.Provider value={{ state, callUser, acceptCall, rejectCall, endCall, myVideo, remoteStreams, isMuted, toggleMute, isVideo, toggleVideo }}>
            {children}

            {/* GLOBAL UI */}
            {state.status === CALL_STATE.RINGING && <IncomingCall caller={state?.peer} isVideo={state?.callType === "video" ? true : false} acceptCall={acceptCall} rejectCall={rejectCall} />}
            {/* {state.status === CALL_STATE.CONNECTED && <VideoCallUI />} */}

            {(state.status === CALL_STATE.OUTGOING || state.status === CALL_STATE.CONNECTING || state.status === CALL_STATE.CONNECTED || state.status === CALL_STATE.RECONNECTED || state.status === CALL_STATE.RECONNECTING)
                &&
                <CallingScreen isCalling={state.status === CALL_STATE.OUTGOING || state.status === CALL_STATE.CONNECTING ? true : false} isVideoCall={state?.callType === "video" ? true : false} />
            }

        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext)