import "../../Styles/Chats.css"

import { useQueryClient } from '@tanstack/react-query'

import NoChat from './NoChat'
import Loading from './Loading'
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaMagnifyingGlass } from "react-icons/fa6"
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

    let { chats, isLoading, error } = useChats()

    const newMessagehandler = (message) => {
        if (activeId) {
            socket.emit("seenMessage", message.chat_id)
            queryClient.setQueryData(["messages", activeId], (oldData) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page, index) => {
                        if (index === 0) {
                            return {
                                ...page,
                                data: [message, ...page.data],
                            };
                        }
                        return page;
                    }),
                };
            })
        }

        queryClient.setQueryData(["chats"], (old) => {
            if (!old) return old;

            let updatedChat = null;

            const rest = old.data.filter(curr => {
                if (curr.chat_id === message.chat_id) {
                    // const ms = new Date().toISOString();
                    updatedChat = {
                        ...curr,
                        last_message: message.content,
                        last_messsage_time: message.created_at,
                        nonce: message.nonce,
                        unread_count: curr.unread_count + 1,
                    };

                    if (me.id === message.sender_id) {
                        updatedChat.unread_count = 0;
                    }

                    if (!activeId && curr.type === "private") {
                        let content
                        if (curr?.last_message) {
                            content = decryptMessage(curr?.last_message, curr?.nonce, curr?.public_key, localStorage.getItem("privateKey"));
                        }

                        showNotification({ ...message, last_message: content })
                    }
                    return false;
                }
                return true;
            });

            return {
                ...old,
                data: [updatedChat, ...rest],
            };
        })
    }
    const handler = (chat) => {
        queryClient.setQueryData(["chats"], (old) => {
            if (!old) return old;
            const newChat = {
                ...chat,
                last_message: null,
                last_messsage_time: null,
                nonce: null,
                unread_count: null
            }

            const filtered = old.data.filter(c => c.chat_id != chat.chat_id);

            return {
                ...old,
                data: [newChat, ...filtered]
            };
        })
    }

    useEffect(() => {
        const events = ["newMessage", "groupMessage"];

        events.forEach(event => socket.on(event, newMessagehandler));

        return () => {
            events.forEach(event => socket.off(event, newMessagehandler));
        };
    }, [queryClient, activeId]);


    useEffect(() => {
        socket.on("newChat", handler)
        return () => socket.off("newChat", handler)
    }, [queryClient])


    if (!isLoading && chats.length === 0) return <div className="noUser-state"><NoChat /></div>
    if (isLoading) return <Loading />
    return (
        <div className="chats">
            <h2 className="chats-heading">Messages</h2>

            <div className="chats-buttons-container">
                <div className="chats-buttons">
                    <button type='button' className="chats-go-button chats-go-button-active">General <span style={{ color: "#ccc" }}>{chats.length}</span></button>
                    <button type='button' className="chats-go-button">Archive</button>
                </div>
            </div>

            <button type="button" className="chats-search-button" onClick={() => navigate('/users')}>
                <p>Search...</p>
                <FaMagnifyingGlass className="chats-search-magnifying" />
            </button>

            <div className="chat-Cards">
                <ChatsList data={chats} activeId={activeId} />
            </div>
        </div>
    )
}

export default Chats