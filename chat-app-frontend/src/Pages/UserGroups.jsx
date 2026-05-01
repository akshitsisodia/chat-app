import React from 'react'
import Layout from '../Components/layout/Layout'
import Groups from '../Components/ui/Groups'
import NoChat from '../Components/ui/NoChat'
import MyProfile from '../Components/ui/MyProfile'

function UserGroups() {
    return (
        <Layout >
            <div className="prev-chats">
                <Groups />
                <div className="prevChats-chat-page">
                    <MyProfile />
                </div>
            </div>
        </Layout >
    )
}

export default UserGroups