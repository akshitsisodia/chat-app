import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";
import { getPrevChats } from "../Services/chatsApi";


const ChatsContext = createContext({
    chats: [],
    isLoading: false,
    error: null,
});

export const ChatsProvider = ({ children }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["chats"],
        queryFn: getPrevChats,
    })
    const chats = data?.data ?? []

    const value = useMemo(() => ({
        chats,
        isLoading,
        error,
    }), [chats, isLoading, error]);


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