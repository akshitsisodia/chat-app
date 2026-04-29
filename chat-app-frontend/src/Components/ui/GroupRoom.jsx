import "../../Styles/Chat.css"

import ButtonGoBack from "../common/ButtonGoBack";

import { useEffect, useRef, useState } from "react";
import { getPrivateMessage } from "../../Services/MessageAPI";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SendGroupMessageForm from "../form/SendGroupMessageForm";
import GroupMessages from "./GroupMessages";
import { useAuth } from "../../Context/AuthContext";
import ChatRoomTop from "../cards/ChatRoomTop";
import { useChats } from "../../Context/ChatsContext";
import { useSocket } from "../../Context/SocketContext";
import UserImageButton from "../buttons/UserImageButton";
import UserContentButton from "../buttons/UserContentButton";

function GroupRoom({ activeId }) {
    const { chats } = useChats()

    const bottomRef = useRef(null);


    const chat = chats?.find(curr => curr.chat_id === activeId)

    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const [content, setContent] = useState("")
    const [scroll, setScroll] = useState(true);

    const chatRef = useRef();

    const LIMIT = 20;

    let groupKey;


    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["messages", activeId],

        queryFn: ({ pageParam = 0, signal }) =>
            getPrivateMessage({
                id: activeId,
                offset: pageParam,
                limit: LIMIT,
                signal
            }),

        getNextPageParam: (lastPage, pages) => {
            const totalLoaded = pages.reduce(
                (acc, page) => acc + page.data.length,
                0
            );


            return totalLoaded < lastPage.count
                ? totalLoaded
                : undefined;
        },
    });

    const messages = data?.pages
        .flatMap(page => page.data)
        .filter((msg, index, self) =>
            index === self.findIndex(m => m.id === msg.id)
        ) ?? [];

    const receivers = data?.pages
        .flatMap((page) => page.receivers)
        ?? []

    const messageScrollHandler = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isAtTop = scrollTop <= -(scrollHeight - clientHeight - 1);

        if (!isFetchingNextPage && hasNextPage && isAtTop && scroll) {
            setScroll(false)
            setTimeout(() => {
                fetchNextPage();
                setScroll(true)
            }, 400)
        }
    }


    useEffect(() => {
        const handler = (message) => {
            queryClient.setQueryData(["messages", activeId], (oldData) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page, index) => {
                        if (index === 0) {
                            return {
                                ...page,
                                data: page.data.map(curr => {
                                    return {
                                        ...curr,
                                        seen: true
                                    }
                                }),
                            };
                        }
                        return page;
                    }),
                };
            })

            queryClient.setQueryData(["chats"], (old) => {
                if (!old) return old;


                const updated = old.data.map(curr => {
                    if (curr.chat_id === activeId) {
                        const update = {
                            ...curr,
                            unread_count: 0
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
        socket?.on("updateSeen", handler)

        return () => socket.off("updateSeen", handler)
    }, [queryClient, activeId])

    useEffect(() => {
        bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
    }, [content, activeId]);

    return (
        <div className="chat">
            <div className="chat-top">
                <ButtonGoBack />
                <UserImageButton photo={chat?.chat_photo} name={chat?.chat_name} />
                <UserContentButton name={chat?.chat_name} chatId={activeId} />
            </div>

            <div ref={chatRef} className="chat-main" onScroll={messageScrollHandler}>
                <GroupMessages bottomRef={bottomRef} receivers={receivers} id={activeId} content={content} messages={messages} />
                {isFetchingNextPage || !scroll && <div className="loader"></div>}
                {/* <br /> */}
                {/* {messages.length < 20 && <ProfileUserDetails user={receiver} />} */}
            </div>

            {/* input  */}
            <div className="chat-bottom">
                <SendGroupMessageForm groupKey={groupKey} receiver={receivers[0]} id={activeId} content={content} setContent={setContent} />
            </div>
        </div>
    )
}

export default GroupRoom