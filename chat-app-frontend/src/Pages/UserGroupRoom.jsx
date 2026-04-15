import React from 'react'
import Layout from '../Components/layout/Layout'
import Chat from '../Components/ui/Chat';
import { useParams } from 'react-router-dom';
import Groups from '../Components/ui/Groups';
import GroupRoom from '../Components/ui/GroupRoom';

function UserGroupRoom() {
    const { id } = useParams();

    return (
        <Layout>
            <div className="privateMessage-prevChats-page">
                <Groups activeId={id} />
            </div>
            <div className="privateMessage-chat-page">
                <GroupRoom activeId={id} />
            </div>
        </Layout>
    )
}

export default UserGroupRoom