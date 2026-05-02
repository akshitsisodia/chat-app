import { Navigate } from "react-router-dom";
import Layout from "../Components/layout/Layout"
import Chats from "../Components/ui/Chats"
import Loading from "../Components/ui/Loading";
import MyProfile from "../Components/ui/MyProfile"
// import { useChats } from "../Context/ChatsContext";

function PreviousChats() {
  // const { chats = [], isLoading, error } = useChats();

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
