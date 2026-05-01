import React, { useState } from 'react'
import Model from './Model'
import SearchUsers from '../ui/SearchUsers'
import { FaUserPlus } from 'react-icons/fa'

function InviteMembersModal({ onClose, onInvite, currentParticipants }) {
    const [selectedUsers, setSelectedUsers] = useState([])

    const handleInvite = () => {
        if (selectedUsers.length === 0) {
            alert("Please select at least one user to invite");
            return;
        }
        onInvite(selectedUsers);
        setSelectedUsers([]);
        onClose();
    }

    return (
        <Model onClose={onClose}>
            <div className="invite-members-modal">
                <SearchUsers
                    heading="Select Users to Invite"
                    select="select"
                    setMembers={setSelectedUsers}
                    memberIds={selectedUsers}
                />
            </div>

            <div className="invite-modal-actions">
                <button
                    className="invite-cancel-btn"
                    onClick={onClose}
                >
                    Cancel
                </button>
                <button
                    className="invite-confirm-btn"
                    onClick={handleInvite}
                    disabled={selectedUsers.length === 0}
                >
                    <FaUserPlus /> Invite {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                </button>
            </div>
        </Model>
    )
}

export default InviteMembersModal
