import "../../Styles/Chats.css"

import { useNavigate } from "react-router-dom"
import { FaMagnifyingGlass } from "react-icons/fa6"
import { FaArchive } from "react-icons/fa"

import NoChat from "./NoChat"
import Loading from "./Loading"
import ChatsList from "../common/ChatsList"
import { useChats } from "../../Context/ChatsContext"
import MyProfile from "./MyProfile"

function Chats({ activeId }) {
    const navigate = useNavigate();
    const { chats = [], isLoading, error } = useChats();

    if (isLoading) {
        return (
            <div className="chats">
                <Loading />
            </div>
        );
    }

    return (
        <div className="chats">
            <div>
                <h1 className="chats-heading">Messages</h1>
                {/* <p>{chats.length} conversation{chats.length === 1 ? "" : "s"}</p> */}
            </div>

            <div className="chats-buttons">
                <button type="button" className="chats-go-button chats-go-button-active">
                    <span>General</span>
                    <strong>{chats.length}</strong>
                </button>
                <button type="button" className="chats-go-button" disabled>
                    <FaArchive />
                    <span>Archive</span>
                </button>
            </div>

            <button type="button" className="chats-search-button" onClick={() => navigate("/users")}>
                <p>Search people</p>
                <FaMagnifyingGlass className="chats-search-magnifying" />
            </button>

            {error && <p className="chats-error">Could not load conversations.</p>}

            {!error && chats.length === 0 ? (
                <NoChat />
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
    );
}

export default Chats
