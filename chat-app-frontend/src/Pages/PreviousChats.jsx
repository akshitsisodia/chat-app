import Layout from "../Components/layout/Layout"
import Chats from "../Components/ui/Chats"
import NoChat from "../Components/ui/NoChat"

function PreviousChats() {

  return (
    <Layout>
      <div className="prev-chats">
        <Chats />
        <div className="prevChats-chat-page">
          <NoChat />
        </div>
      </div>
    </Layout>
  )
}

export default PreviousChats