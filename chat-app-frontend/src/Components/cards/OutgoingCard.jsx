import React from 'react'
import { FaPhoneAlt } from 'react-icons/fa'

function OutgoingCard() {
    return (
        <div className="incomming-card">
            <div className="incomming-card-icon">
                <FaPhoneAlt />
            </div>
            <div className="incomming-card-main">
                <h4>Voice call</h4>
                <p>No answer</p>
            </div>
            <div className="incomming-card-last">
                <span>5:45 PM</span>
            </div>
        </div>
    )
}

export default OutgoingCard