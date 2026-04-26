
import { NavLink } from 'react-router-dom'

import "../../Styles/Sidebar.css"
import { FaMessage, FaPlus, FaRightFromBracket, FaUserGroup, FaUserPlus, FaXmark } from 'react-icons/fa6'
import { FaSearch } from 'react-icons/fa'
import { useAuth } from '../../Context/AuthContext'
import LogoutButton from '../buttons/LogoutButton'

function Sidebar({ show, setShow }) {
    // const { me, logout } = useAuth();
    // const logoutClickedHandler = () => {
    //     logout();
    // }
    return (
        <aside className={`sidebar ${show ? "show" : ""}`} id='sidebar'>
            <div className="sidebar-top">
                <FaXmark onClick={setShow} className='sidebar-x-mark' />
                <h2 className="sidebar-heading">
                    <span className='sidebar-heading-logo' />
                    <span className="aside-name">ChatApp</span>
                </h2>

                <nav className="sidebar-nav">
                    <ul className="nav-links">
                        <li className="nav-link "><NavLink to={'/users'} className={({ isActive }) => isActive ? "nav-link-active" : ""}><FaSearch className='aside-icon' /><span className="aside-name">Search</span></NavLink></li>
                        <li className={"nav-link"}><NavLink to={'/'} className={({ isActive }) => isActive || window.location.pathname.startsWith("/69") ? "nav-link-active" : ""}  ><FaMessage className='aside-icon' /><span className="aside-name">Messages</span></NavLink></li>
                        <li className={"nav-link"}><NavLink to={'/my-groups'} className={({ isActive }) => isActive ? "nav-link-active" : ""}  ><FaUserGroup className='aside-icon' /><span className="aside-name">My Groups</span></NavLink></li>
                        <li className={"nav-link"}><NavLink to={'/create-group'} className={({ isActive }) => isActive ? "nav-link-active" : ""}  ><FaPlus className='aside-icon' /><span className="aside-name">Create Group</span></NavLink></li>
                    </ul>
                </nav>
            </div>
            <div className="sidebar-bottom">
                <p>©2026 ChatApp, All rights reserved.</p>
                <p>Terms of use</p>
                <LogoutButton />
            </div>
        </aside>
    )
}

export default Sidebar
