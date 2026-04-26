import Sidebar from './Sidebar'
import Header from './Header'
import "../../Styles/Layout.css"
import DarkBackground from './DarkBackground'
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function Layout({ children }) {
    const queryClient = useQueryClient();
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        queryClient.setQueryData(["unread"], {});
    }, []);

    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    return (
        <div className="layout">
            <DarkBackground show={showSidebar} setShow={() => setShowSidebar(false)} />
            <Sidebar show={showSidebar} setShow={() => setShowSidebar(false)} />
            <div className="layout-content">
                <Header show={showSidebar} setShow={() => setShowSidebar(true)} />
                {children}
            </div>
        </div>
    )
}

export default Layout