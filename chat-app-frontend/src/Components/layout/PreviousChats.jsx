import Layout from "../Components/layout/Layout"
import Chats from "../Components/ui/Chats"
import NoChat from "../Components/ui/NoChat"

function PreviousChats() {

  return (
    <Layout>
      <Chats />
      <div className="prevChats-chat-page">
        <NoChat />
      </div>
    </Layout>
  )
}

export default PreviousChats