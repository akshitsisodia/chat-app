import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { getPrevChats } from "../Services/chatsApi";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import showNotification from "../Util/showNotification";
import { decryptMessage } from "../Hooks/useEncryptMessage";


const ChatsContext = createContext({
    chats: [],
    isLoading: false,
    error: null,
    setActiveConversationId: () => {},
});

export const ChatsProvider = ({ children }) => {
    const { me } = useAuth();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const activeConversationIdRef = useRef(null);

    const setActiveConversationId = useCallback((id) => {
        activeConversationIdRef.current = id ?? null;
    }, []);
    const { data, isLoading, error } = useQuery({
        queryKey: ["chats"],
        queryFn: getPrevChats,
        enabled: !!me
    })
    let chats = me ? (data?.data ?? []) : [];

    /* Subscribed here (not in Chat/Chats) so we never miss `newChat` before a route
       mounts and so private inbox + open conversation stay in sync. */
    useEffect(() => {
        if (!socket || !me) return;

        const newChatHandler = (chat) => {
            if (!chat) return;

            queryClient.setQueryData(["chats"], (old) => {
                if (!old?.data) {
                    return {
                        data: [{
                            ...chat,
                            last_message: null,
                            last_message_time: null,
                            nonce: null,
                            unread_count: 0,
                        }],
                    };
                }

                const index = old.data.findIndex(
                    (c) => c.chat_id === chat.chat_id
                );

                const baseChat = {
                    ...chat,
                    photo: chat.chat_photo,
                    name: chat.chat_name,
                    last_message: null,
                    last_message_time: null,
                    nonce: null,
                    unread_count: 0,
                };

                if (index !== -1) {
                    const newData = [...old.data];
                    const [removed] = newData.splice(index, 1);
                    newData.unshift({
                        ...removed,
                        ...baseChat,
                    });

                    return { ...old, data: newData };
                }

                return {
                    ...old,
                    data: [baseChat, ...old.data],
                };
            });
        };

        socket.on("newChat", newChatHandler);
        return () => socket.off("newChat", newChatHandler);
    }, [socket, me, queryClient]);

    useEffect(() => {
        if (!socket || !me) return;

        const newMessageHandler = (message) => {
            if (!message) return;

            const activeId = activeConversationIdRef.current;
            const isActiveChat =
                activeId && String(activeId) === String(message.chat_id);

            if (isActiveChat) {
                socket.emit("seenMessage", message.chat_id);

                queryClient.setQueryData(["messages", activeId], (oldData) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        pages: oldData.pages.map((page, i) =>
                            i === 0
                                ? { ...page, data: [message, ...page.data] }
                                : page
                        ),
                    };
                });
            }

            let shouldNotify = false;
            let notifyPayload = null;

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

                if (
                    String(activeId ?? "") !== String(message.chat_id) &&
                    curr.type === "private"
                ) {
                    shouldNotify = true;
                    notifyPayload = { message, curr };
                }

                const newData = [...old.data];
                newData.splice(index, 1);
                newData.unshift(updatedChat);

                return { ...old, data: newData };
            });

            if (shouldNotify && notifyPayload) {
                try {
                    const { message: msg, curr } = notifyPayload;

                    let content = msg.content;
                    const privateKey = localStorage.getItem("privateKey");

                    if (privateKey && msg.content) {
                        content = decryptMessage(
                            msg.content,
                            msg.nonce,
                            curr.public_key,
                            privateKey
                        );
                    }

                    showNotification({
                        ...msg,
                        last_message: content,
                    });
                } catch (err) {
                    console.error("Notification/decrypt error:", err);
                }
            }
        };

        socket.on("newMessage", newMessageHandler);
        socket.on("groupMessage", newMessageHandler);

        return () => {
            socket.off("newMessage", newMessageHandler);
            socket.off("groupMessage", newMessageHandler);
        };
    }, [socket, me, queryClient]);

    const value = useMemo(() => ({
        chats,
        isLoading,
        error,
        setActiveConversationId,
    }), [chats, isLoading, error, setActiveConversationId]);

    return (
        <ChatsContext.Provider value={value}>
            {children}
        </ChatsContext.Provider>
    )
}

export const useChats = () => {
    const context = useContext(ChatsContext);
    if (!context) {
        throw new Error("useChats must be used within ChatsProvider");
    }
    return context;
};