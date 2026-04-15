import React from 'react'
import Layout from '../Components/layout/Layout'
import Groups from '../Components/ui/Groups'
import NoChat from '../Components/ui/NoChat'

function UserGroups() {
    return (
        <Layout >
            <Groups />
            <div className="prevChats-chat-page">
                <NoChat />
            </div>
        </Layout >
    )
}

export default UserGroups