import { useEffect } from 'react'
import Layout from '../Components/layout/Layout'
import Chats from '../Components/ui/Chats'
import Chat from '../Components/ui/Chat'
import { useParams } from 'react-router-dom'
import { useChats } from '../Context/ChatsContext'

function PrivateMessages() {
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
          <Chats activeId={id} />
        </div>
        <div className="privateMessage-chat-page">
          <Chat id={id} />
        </div>
      </div>
    </Layout>
  )
}

export default PrivateMessages