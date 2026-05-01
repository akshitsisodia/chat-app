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

    const handler = (message) => {
        if (!message) return;

        const isActiveChat =
            activeId && String(activeId) === String(message.chat_id);

        if (isActiveChat) {
            socket.emit("seenMessage", message.chat_id)

            queryClient.setQueryData(["messages", activeId], (oldData) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page, i) =>
                        i === 0
                            ?
                            { ...page, data: [message, ...page.data] }
                            : page
                    ),
                };
            })
        }

        let shouldNotify = false;
        let notifyPayload = null;

        // 2. Update chats (PURE logic only)
        queryClient.setQueryData(["chats"], (old) => {
            if (!old?.data) return old;

            const index = old.data.findIndex(
                (c) => c.chat_id === message.chat_id
            );

            if (index === -1) return old;

            const curr = old.data[index];

            const unread_count =
                me?.id === message.sender_id || isActiveChat
                    ? 0
                    : curr.unread_count + 1;

            const updatedChat = {
                ...curr,
                last_message: message.content,
                last_message_time: message.created_at,
                nonce: message.nonce,
                message_type: message.message_type,
                key_version: message.key_version,
                unread_count,
            };

            // prepare notification (NO side effects here)
            if (
                activeId !== message.chat_id &&
                curr.type === "private"
            ) {
                shouldNotify = true;
                notifyPayload = { message, curr };
            }

            // move chat to top
            const newData = [...old.data];
            newData.splice(index, 1);
            newData.unshift(updatedChat);

            return { ...old, data: newData };
        });
        console.log(shouldNotify, notifyPayload)

    }
    useEffect(() => {
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