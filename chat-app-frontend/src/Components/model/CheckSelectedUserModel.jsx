import { useState } from "react";
import UsersList from "../common/UsersList"
import { FaUserPlus } from "react-icons/fa";
import Model from "./Model";


function CheckSelectedUserModel({ selected, onClose, onBack, addHandler }) {
    const [selectedUsers, setSelectedUsers] = useState(selected || [])

    const selectedIds = selectedUsers?.map(curr => { return curr.id });

    const handleAdd = () => {
        if (selectedUsers.length === 0) {
            alert("Please select at least one user to invite");
            return;
        }
        addHandler(selectedUsers);
        setSelectedUsers([]);
        onClose();
    }

    return (
        <Model onClose={onClose}>
            <div className="invite-members-modal">
                <h2>Selected Members</h2>
                <div className="userList-container">

                    <UsersList
                        data={selectedUsers}
                        select={'remove'}
                        setMembers={setSelectedUsers}
                        memberIds={selectedIds}
                    />
                </div>
            </div>

            <div className="invite-modal-actions">
                <button
                    className="invite-cancel-btn"
                    onClick={() => { onBack(); onClose(); }}
                >
                    Back
                </button>
                <button
                    className="invite-confirm-btn"
                    onClick={handleAdd}
                    disabled={selectedUsers.length === 0}
                >
                    <FaUserPlus /> Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                </button>
            </div>
        </Model >
    )
}

export default CheckSelectedUserModel