import React from 'react'
import { FaPhone, FaPhoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa'
import { useCall } from '../../Context/CallContext'

function IncomingCall({ caller, isVideo = false }) {
    const { acceptCall, rejectCall } = useCall()
    return (
        <div className="incoming-call">
            <div className="incomong-call-user">
                <img src={caller?.photo} alt={caller?.name} />
                {/* <p>{caller?.email}</p> */}
                <h3>{caller?.name}</h3>
                <p>is now {isVideo ? "video" : "audio"} calling...</p>
            </div>
            <div className="incoming-call-buttons">
                <button
                    type="button"
                    onClick={rejectCall}
                    className="reject-call incoming-button"
                >
                    {isVideo ?
                        <FaVideoSlash />
                        : <FaPhoneSlash style={{ transform: "scaleX(-1)" }} />
                    }
                    <p>Reject</p>
                </button>
                <button
                    type="button"
                    onClick={acceptCall}
                    className="accept-call incoming-button">
                    {isVideo ?
                        <FaVideo />
                        : <FaPhone style={{ transform: "scaleX(-1)" }} />
                    }
                    <p>Accept</p>

                </button>
            </div>
        </div>
    )
}

export default IncomingCall