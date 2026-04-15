import "../../Styles/Chats.css"

import { useQuery, useQueryClient } from '@tanstack/react-query'

import NoChat from './NoChat'
import Loading from './Loading'
import { getMyGroups } from "../../Services/chatsApi"
import { useEffect } from "react"
import { getSocket } from "../../Lib/socket"
import { useNavigate } from "react-router-dom"
import { FaMagnifyingGlass } from "react-icons/fa6"
import ChatsList from "../common/ChatsList"


function Groups({ activeId }) {
    const queryClient = useQueryClient();
    const socket = getSocket();
    const navigate = useNavigate();


    const { data, isLoading, error } = useQuery({
        queryKey: ["groups"],
        queryFn: getMyGroups,
    })
    const chats = data?.data ?? []

    useEffect(() => {
        const handler = (message) => {
            if (activeId) {
                socket.emit("seenMessage", { chatId: message.chat_id, receiverId: activeId })
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

            queryClient.setQueryData(["groups"], (old) => {
                if (!old) return old;

                const updated = old.data.map(curr => {
                    if (curr.chat_id === message.chat_id) {

                        const update = {
                            ...curr,
                            last_message: message.content,
                            last_messsage_time: message.created_at,
                            nonce: message.nonce,

                        }

                        if (curr.user_id === message.sender_id) {
                            update.unread_count = message.unread_count;
                        }

                        return update;
                    }

                    return curr
                })

                return {
                    ...old,
                    data: updated
                };
            })
        }

        socket.on("newMessage", handler)

        return () => socket.off("newMessage", handler)
    }, [queryClient, activeId])


    useEffect(() => {
        const handler = (chat) => {
            queryClient.setQueryData(["groups"], (old) => {
                if (!old) return old;

                const filtered = old.data.filter(c => c.chat_id != chat.chat_id);

                return {
                    ...old,
                    data: [chat, ...filtered]
                };
            })
        }
        socket.on("newChat", handler)
        return () => socket.off("newChat", handler)
    }, [queryClient])


    if (!isLoading && chats.length === 0) return <div className="noUser-state"><NoChat /></div>
    if (isLoading) return <Loading />
    return (
        <div className="chats">
            <h2 className="chats-heading">Groups</h2>

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

export default Groups