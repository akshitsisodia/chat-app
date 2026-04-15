import "../../Styles/Chat.css"

import UserCard from "../cards/UserCard";
import ButtonGoBack from "../common/ButtonGoBack";
import Messages from "./Messages";
import SendMessageForm from "../form/SendMessageForm";
import { useEffect, useRef, useState } from "react";
import { getPrivateMessage } from "../../Services/MessageAPI";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../../Lib/socket";

function Chat({ id }) {
    const queryClient = useQueryClient();
    const socket = getSocket();

    const [content, setContent] = useState("")
    const [scroll, setScroll] = useState(true);

    const chatRef = useRef();

    const LIMIT = 20;

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["messages", id],

        queryFn: ({ pageParam = 0, signal }) =>
            getPrivateMessage({
                id: id,
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
            queryClient.setQueryData(["messages", id], (oldData) => {
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

        }
        socket?.on("updateSeen", handler)

        return () => socket.off("updateSeen", handler)
    }, [queryClient, id])

    return (
        <div className="chat">
            {/* head  */}
            <div className="chat-top">
                <ButtonGoBack />

                <UserCard receiver={receivers[0]} chatId={id}>
                    {/* <FaEllipsisV /> */}
                </UserCard>
            </div>

            {/* main  */}
            <div ref={chatRef} className="chat-main" onScroll={messageScrollHandler}>
                <Messages receiver={receivers[0]} id={id} content={content} messages={messages} />
                {isFetchingNextPage || !scroll && <div className="loader"></div>}
                {/* <br /> */}
                {/* {messages.length < 20 && <ProfileUserDetails user={receiver} />} */}
            </div>

            {/* input  */}
            <SendMessageForm receiver={receivers[0]} id={id} content={content} setContent={setContent} />
        </div>
    )
}

export default Chat