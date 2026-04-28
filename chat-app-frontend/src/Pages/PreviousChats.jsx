import Layout from "../Components/layout/Layout"
import Chats from "../Components/ui/Chats"
import MyProfile from "../Components/ui/MyProfile"

function PreviousChats() {

  return (
    <Layout>
      <div className="prev-chats">
        <Chats />
        <div className="prevChats-chat-page">
          <MyProfile />
        </div>
      </div>
    </Layout>
  )
}

export default PreviousChats
