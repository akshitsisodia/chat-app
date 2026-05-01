import "../../Styles/Chats.css"

import { useQueryClient } from '@tanstack/react-query'

import NoChat from './NoChat'
import Loading from './Loading'
import { useEffect } from "react"
import { getSocket } from "../../Lib/socket"
import ChatsList from "../common/ChatsList"
import { useChats } from "../../Context/ChatsContext"
import { useAuth } from "../../Context/AuthContext"
import { useSocket } from "../../Context/SocketContext"


function Groups({ activeId }) {
    const { me } = useAuth();
    let { chats, isLoading, error } = useChats();
    const queryClient = useQueryClient();
    const { socket } = useSocket();


    chats = chats?.filter(curr => curr.type === "group") ?? []

    useEffect(() => {
        const handler = (message) => {
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

                const updated = old.data.map(curr => {

                    if (curr.chat_id === message.chat_id) {

                        const update = {
                            ...curr,
                            last_message: message.content,
                            last_messsage_time: message.created_at,
                            nonce: message.nonce,
                            message_type: message.message_type,
                            key_version: message.key_version,
                            unread_count: curr.unread_count + 1,

                        }

                        if (me.id === message.sender_id) {
                            update.unread_count = 0;
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
        socket.on("groupMessage", handler)

        return () => socket.off("groupMessage", handler)
    }, [socket, queryClient, activeId])


    useEffect(() => {
        const handler = (chat) => {
            queryClient.setQueryData(["chats"], (old) => {
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
    }, [socket, queryClient])


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