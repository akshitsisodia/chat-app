import "../../Styles/Chats.css"

import NoChat from './NoChat'
import Loading from './Loading'
import ChatsList from "../common/ChatsList"
import { useChats } from "../../Context/ChatsContext"


function Groups({ activeId }) {
    let { chats, isLoading } = useChats();

    chats = chats?.filter(curr => curr.type === "group") ?? []

    if (!isLoading && chats.length === 0) return <div className="noUser-state"><NoChat /></div>
    if (isLoading) return <Loading />
    return (
        <div className="chats">
            <h2 className="chats-heading">Groups</h2>
            <div className="chat-Cards">
                <ChatsList data={chats} activeId={activeId} />
            </div>
        </div>
    )
}

export default Groups