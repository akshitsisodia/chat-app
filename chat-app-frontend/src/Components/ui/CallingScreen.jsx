import React, { useState } from 'react'
import { FaMicrophoneSlash, FaPhoneSlash, FaVideo } from 'react-icons/fa'
import { FaGear, FaMaximize, FaMinimize, FaVolumeHigh } from 'react-icons/fa6'

function CallingScreen({ myVideo, remoteVideo, endCall, isCalling = true }) {
    const [isMaximize, setIsMaximize] = useState(false)

    return (
        <>

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
                    {/* <button className="videocall-other-button" onClick={endCall}><FaMicrophoneSlash /></button> */}
                    <button className="videocall-end-button" onClick={() => endCall("END")}><FaPhoneSlash /></button>
                    {/* <button className="videocall-other-button" onClick={endCall}><FaVideo /></button> */}
                    {/* <button className="videocall-other-button" onClick={endCall}><FaGear /></button> */}
                </div>
            </div>

            <button
                type="button"
                onClick={isMaximize ? () => { } : () => isMaximize ? setIsMaximize(false) : setIsMaximize(true)}
                className={(isMaximize ? "videocall-max" : "videocall-min")}
            >
                <video ref={myVideo} autoPlay muted />
            </button>
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