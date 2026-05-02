import { useEffect } from 'react'
import Layout from '../Components/layout/Layout'
import { useParams } from 'react-router-dom';
import Groups from '../Components/ui/Groups';
import GroupRoom from '../Components/ui/GroupRoom';
import { useChats } from '../Context/ChatsContext';

function UserGroupRoom() {
    const { id } = useParams();
    const { setActiveConversationId } = useChats();

    useEffect(() => {
        setActiveConversationId(id);
        return () => setActiveConversationId(null);
    }, [id, setActiveConversationId]);

    return (
        <Layout>
            <div className="private-messages">
                <div className="privateMessage-prevChats-page">
                    <Groups activeId={id} />
                </div>
                <div className="privateMessage-chat-page">
                    <GroupRoom activeId={id} />
                </div>
            </div>
        </Layout>
    )
}

export default UserGroupRoom