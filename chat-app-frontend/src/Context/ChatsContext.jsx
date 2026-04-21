import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";
import { getPrevChats } from "../Services/chatsApi";
import { useAuth } from "./AuthContext";


const ChatsContext = createContext({
    chats: [],
    isLoading: false,
    error: null,
});

export const ChatsProvider = ({ children }) => {
    const { me } = useAuth();
    const { data, isLoading, error } = useQuery({
        queryKey: ["chats"],
        queryFn: getPrevChats,
        enabled: !!me
    })
    let chats = me ? (data?.data ?? []) : [];
    chats = chats.filter(curr => { return (curr && (curr?.last_message !== null || curr?.type === 'group')) })

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