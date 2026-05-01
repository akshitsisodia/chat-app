import React, { useState } from 'react'
import Model from './Model'
import SearchUsers from '../ui/SearchUsers'
import { FaUserPlus } from 'react-icons/fa'

function SelectUsersModel({ onClose, setSelected }) {
    const [selectedUsers, setSelectedUsers] = useState([])

    const handleSelect = () => {
        if (selectedUsers.length === 0) {
            alert("Please select at least one user to invite");
            return;
        }
        setSelected(selectedUsers);
        setSelectedUsers([]);
        onClose();
    }

    return (
        <Model onClose={onClose}>
            <div className="invite-members-modal">
                <SearchUsers
                    select={"select"}
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
                    onClick={handleSelect}
                    disabled={selectedUsers.length === 0}
                >
                    <FaUserPlus /> Select {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                </button>
            </div>
        </Model>
    )
}

export default SelectUsersModel