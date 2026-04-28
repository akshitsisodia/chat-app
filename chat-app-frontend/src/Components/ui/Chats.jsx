import "../../Styles/Chats.css"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaMagnifyingGlass } from "react-icons/fa6"
import { FaArchive } from "react-icons/fa"

import NoChat from "./NoChat"
import Loading from "./Loading"
import ChatsList from "../common/ChatsList"
import { useChats } from "../../Context/ChatsContext"
import showNotification from "../../Util/showNotification"
import { decryptMessage } from "../../Hooks/useEncryptMessage"
import { useAuth } from "../../Context/AuthContext"
import { useSocket } from "../../Context/SocketContext"

function Chats({ activeId }) {
    const { me } = useAuth();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { chats = [], isLoading, error } = useChats();

    const newMessageHandler = useCallback((message) => {
        if (!message) return;

        const isActiveChat = activeId && String(activeId) === String(message.chat_id);

        if (isActiveChat) {
            socket?.emit("seenMessage", message.chat_id);
            queryClient.setQueryData(["messages", activeId], (oldData) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page, index) => {
                        if (index !== 0) return page;

                        return {
                            ...page,
                            data: [message, ...page.data],
                        };
                    }),
                };
            });
        }

        queryClient.setQueryData(["chats"], (old) => {
            if (!old) return old;

            let updatedChat = null;
            const rest = old.data.filter((curr) => {
                if (curr.chat_id !== message.chat_id) return true;

                updatedChat = {
                    ...curr,
                    last_message: message.content,
                    last_message_time: message.created_at,
                    nonce: message.nonce,
                    unread_count: curr.unread_count + 1,
                };

                if (me?.id === message.sender_id || isActiveChat) {
                    updatedChat.unread_count = 0;
                }

                if (!activeId && curr.type === "private") {
                    let content = message.content;
                    const privateKey = localStorage.getItem("privateKey");

                    if (privateKey && message.content) {
                        content = decryptMessage(
                            message.content,
                            message.nonce,
                            curr.public_key,
                            privateKey
                        );
                    }

                    showNotification({ ...message, last_message: content });
                }

                return false;
            });

            if (!updatedChat) return old;

            return {
                ...old,
                data: [updatedChat, ...rest],
            };
        });
    }, [activeId, me?.id, queryClient, socket]);

    const newChatHandler = useCallback((chat) => {
        if (!chat) return;

        queryClient.setQueryData(["chats"], (old) => {
            if (!old) return old;

            const newChat = {
                ...chat,
                last_message: null,
                last_message_time: null,
                nonce: null,
                unread_count: 0,
            };
            const filtered = old.data.filter((curr) => curr.chat_id !== chat.chat_id);

            return {
                ...old,
                data: [newChat, ...filtered],
            };
        });
    }, [queryClient]);

    useEffect(() => {
        if (!socket) return;

        const events = ["newMessage", "groupMessage"];
        events.forEach((event) => socket.on(event, newMessageHandler));

        return () => {
            events.forEach((event) => socket.off(event, newMessageHandler));
        };
    }, [socket, newMessageHandler]);

    useEffect(() => {
        if (!socket) return;

        socket.on("newChat", newChatHandler);
        return () => socket.off("newChat", newChatHandler);
    }, [socket, newChatHandler]);

    if (isLoading) {
        return (
            <div className="chats">
                <Loading />
            </div>
        );
    }

    return (
        <div className="chats">
            <div className="chats-header">
                <div>
                    <h1 className="chats-heading">Messages</h1>
                    <p>{chats.length} conversation{chats.length === 1 ? "" : "s"}</p>
                </div>
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
                <div className="chats-empty">
                    <NoChat />
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
    );
}

export default Chats
