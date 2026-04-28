import React from 'react'

function ProfileUserDetails({ user }) {
    return (
        <div style={{ textAlign: "center" }}>
            <img src={user.photo ? user.photo : "https://i.pinimg.com/736x/62/01/0d/62010d848b790a2336d1542fcda51789.jpg"} alt="" className="profile-image" />
            <h3 className="profile-name">{user?.name}</h3>
            <h4 className="profile-email">{user?.email}</h4>
        </div>
    )
}

export default ProfileUserDetails