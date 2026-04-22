import React, { useEffect, useState } from 'react'
import { FaMicrophoneSlash, FaPhoneSlash, FaVideo, FaMicrophone, FaVideoSlash } from 'react-icons/fa'
import { FaGear, FaMaximize, FaMinimize, FaVolumeHigh } from 'react-icons/fa6'
import { useCall } from '../../Context/CallContext'

function CallingScreen({ isCalling = true, isVideoCall }) {
    const [isMaximize, setIsMaximize] = useState(false)
    const { state, isMuted, toggleMute, isVideo, toggleVideo, myVideo, remoteVideo, endCall } = useCall()

    // Use prop isVideoCall if provided, otherwise use context isVideo
    const videoEnabled = isVideoCall !== undefined ? isVideoCall : isVideo;

    const [second, setSecond] = useState(0);
    const [minute, setMinute] = useState(0);
    const [hour, sethour] = useState(0);


    useEffect(() => {
        let interval = null;
        if (state.status === "connected") {
            interval = setInterval(() => {
                setSecond(prevSecond => {
                    if (prevSecond === 59) {
                        setMinute(prevMinute => {
                            if (prevMinute === 59) {
                                sethour(prevHour => prevHour + 1);
                                return 0;
                            }
                            return prevMinute + 1;
                        });
                        return 0;
                    }
                    return prevSecond + 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [state.status]);



    return (
        <>
            <span className="calling-screen-state">{state.status === 'connected' ? (hour === 0 ? "" : (hour.toString().length === 1 ? "0" + hour : hour + ":")) + (minute.toString().length === 2 ? minute : "0" + minute) + ":" + (second.toString().length === 2 ? second : "0" + second) : state.status}</span>
            <div className="videocall-interface-main">
                {/* <button className="videocall-volume-button"><FaVolumeHigh /></button> */}

                <div className="videocall-interface-buttons">
                    {/* {isVideoCall && <button
                        type="button"
                        className="videocall-other-button"
                        onClick={() => isMaximize ? setIsMaximize(false) : setIsMaximize(true)}
                    >
                        {isMaximize ? <FaMaximize /> : <FaMinimize />}
                    </button>} */}
                    <button
                        className="videocall-other-button"
                        onClick={toggleMute}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                    </button>
                    <button className="videocall-end-button" onClick={() => endCall("END")}><FaPhoneSlash /></button>
                    {isVideoCall && <button
                        className="videocall-other-button"
                        onClick={toggleVideo}
                        title={isVideo ? "Video" : "Audio"}>
                        {isVideo ? <FaVideoSlash /> : <FaVideo />}
                    </button>}
                    {/* <button className="videocall-other-button" onClick={endCall}><FaGear /></button> */}
                </div>
            </div>

            <button
                type="button"
                onClick={isMaximize ? () => { } : () => isMaximize ? setIsMaximize(false) : setIsMaximize(true)}
                className={isMaximize ? "videocall-max" : isVideoCall ? "videocall-min" : "videocall-hidden"}

                disabled={!isVideoCall}
            >
                <video ref={myVideo} autoPlay muted />
            </button >
            <button
                type="button"
                onClick={!isMaximize ? () => { } : () => isMaximize ? setIsMaximize(false) : setIsMaximize(true)}
                className={(!isMaximize ? "videocall-max" : "videocall-min")}
            >
                <video ref={remoteVideo} autoPlay />
            </button>
        </>
    )
}

export default CallingScreen