import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext';
import { connectSocket, getSocket } from '../Lib/socket';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { me } = useAuth();
    const [socket, setSocket] = useState(getSocket())
    useEffect(() => {
        if (!me) return;

        const s = connectSocket();
        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, [me])

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext)

