import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../Lib/socket';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { me } = useAuth();
    const [socket, setSocket] = useState(null)

    useEffect(() => {
        if (!me) {
            disconnectSocket();
            setSocket(null);
            return;
        }

        const s = connectSocket();
        setSocket(s);

    }, [me]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext)

