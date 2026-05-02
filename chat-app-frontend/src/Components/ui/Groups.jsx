import "../../Styles/Chats.css"

import NoChat from './NoChat'
import Loading from './Loading'
import ChatsList from "../common/ChatsList"
import { useChats } from "../../Context/ChatsContext"
import { FaPlus, FaUsers } from "react-icons/fa6"
import { useNavigate } from "react-router-dom"


function Groups({ activeId }) {
    const navigate = useNavigate();
    let { chats = [], isLoading, error } = useChats();

    chats = chats?.filter(curr => curr.type === "group") ?? []

    if (isLoading) {
        return (
            <div className="chats">
                <Loading />
            </div>
        );
    }
    return (
        <div className="chats">
            <h1 className="chats-heading">Groups</h1>

            {error && <p className="chats-error">Could not load conversations.</p>}

            {!error && chats.length === 0 ? (
                <div className="noChat">

                    <div className="noChat-logo-container">
                        <FaUsers />
                    </div>
                    <h3>No Previous Chats.</h3>
                    <div>
                        <p style={{ textAlign: "center" }}>Click here to find users or</p>
                        <p style={{ textAlign: "center" }}>to create group.</p>
                    </div>

                    <button type="button" onClick={() => navigate("/create-group")} >
                        <FaPlus />
                        <span>Create Group</span>
                    </button>
                </div>
            ) : (
                <div className="chat-Cards">
                    <ChatsList data={chats} activeId={activeId} />
                </div>
            )}

            <div className="chats-bottom">
                <p>© 2026 ChatApp, All rights reserved.</p>
                <p className="chats-bottom-links">
                    <a href="/terms">Terms</a> &
                    <a href="/privacy">&nbsp;Privacy</a>
                </p>
            </div>

        </div>
    )
}

export default Groups