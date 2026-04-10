import Layout from '../Components/layout/Layout'
import Chats from '../Components/ui/Chats'
import Chat from '../Components/ui/Chat'
import { useParams } from 'react-router-dom'

function PrivateMessages() {
  const { id } = useParams();

  return (
    <Layout>
      <div className="privateMessage-prevChats-page">
        <Chats activeId={id} />
      </div>
      <div className="privateMessage-chat-page">
        <Chat id={id} />
      </div>
    </Layout>
  )
}

export default PrivateMessages