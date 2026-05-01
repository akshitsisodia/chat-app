import { useNavigate, useParams } from "react-router-dom"
import Layout from "../Components/layout/Layout"
import { useChats } from "../Context/ChatsContext"
import "../Styles/Profile.css"
import { useMutation, useQuery } from "@tanstack/react-query";
import { addGroupMembers, getGroupMembers, leaveGroup } from "../Services/chatsApi";
import UsersList from "../Components/common/UsersList";
import { FaEdit, FaTimesCircle } from "react-icons/fa";
import { FaBell, FaClock, FaHeart, FaLock, FaPhone, FaPlus, FaRightFromBracket, FaTelegram, FaThumbsDown, FaTimeline, FaUser, FaUserLock, FaUserPlus, FaVideo } from "react-icons/fa6";
import ButtonGoBack from "../Components/common/ButtonGoBack";
import { useState } from "react";
import SelectUsersModel from "../Components/model/SelectUsersModel";
import CheckSelectedUserModel from "../Components/model/CheckSelectedUserModel";
import { useCall } from "../Context/CallContext";

function ChatProfile() {
    const { id } = useParams();
    const { chats } = useChats();
    const { callUser, startGroupCall } = useCall()

    const navigate = useNavigate();

    let chat = chats?.find(curr => { return curr.chat_id === id })
    let photo;
    let name;
    let email;
    let isGroup = false;

    const [openSelect, setOpenSelect] = useState(false)
    const [openCheck, setOpenCheck] = useState(false)

    const [selected, setSelected] = useState([])

    const { data, isLoading, error } = useQuery({
        queryKey: ["members", id],
        queryFn: () => getGroupMembers({ id }),
        retry: false,
    })
    const members = data?.data ?? []

    if (chat?.type === 'private') {
        photo = chat.photo;
        name = chat.name;
        email = chat.email;
    } else {
        const admin = members.find(curr => { return curr.role === "admin" })
        photo = chat?.chat_photo;
        name = chat?.chat_name;
        email = admin?.email
        isGroup = true
    }

    const leaveGroupMutation = useMutation({
        mutationFn: leaveGroup,
        onSuccess: (data) => {
            console.log(data)
            navigate("/")

        },
        onError: (error) => {
            console.error(error)
        }
    })
    const addGroupMembersMutation = useMutation({
        mutationFn: addGroupMembers,
        onSuccess: (data) => {
            console.log(data)
            navigate(`/my-groups/${id}`)
        },
        onError: (error) => {
            console.error(error)
        }
    })

    const exitGroupButtonHandler = () => {
        leaveGroupMutation.mutate(id)
    }

    const selectUsersHandler = (data) => {
        setSelected(data)
        setOpenCheck(true)
    }

    const addGroupMembersButtonHandler = (data) => {
        if (data.length === 0) return
        const newMembers = data?.map(curr => { return curr.id });
        addGroupMembersMutation.mutate({ chatId: id, newMembers })
    }
    let receiver;
    if (chat?.type === "private") {
        receiver = members?.find(curr => curr.id === chat.user_id)
    }

    return (
        <Layout>
            {openSelect && <SelectUsersModel onClose={() => setOpenSelect(false)} setSelected={selectUsersHandler} />}
            {openCheck && <CheckSelectedUserModel onClose={() => setOpenCheck(false)} onBack={() => setOpenSelect(true)} selected={selected} addHandler={addGroupMembersButtonHandler} />}


            <div className="chat-profile">
                <div className="chat-profile-header">
                    <ButtonGoBack />
                    <p></p>
                </div>

                <div className="profile-top">
                    <img src={photo} alt="img" className="profile-image" />
                    <h3 className="profile-name">{name}</h3>
                    {/* created by  */}
                    <p style={{ color: "var(--primary-color)" }}>{email}</p>

                    {isGroup && <p style={{ margin: "0 1.5rem", marginTop: "1rem", color: "#999" }}>Group - <span style={{ color: "var(--primary-color)" }}>{members?.length} members</span></p>}

                    <div className="profile-buttons">
                        <button
                            type="button"
                            className="profile-add-button"
                            onClick={() => { chat?.type === "private" ? (receiver ? callUser(receiver, false) : {}) : (members?.length > 1 ? startGroupCall(members, false) : {}) }}
                        >
                            <FaPhone />
                            Audio
                        </button>
                        <button
                            type="button"
                            className="profile-add-button"
                            onClick={() => { chat?.type === "private" ? (receiver ? callUser(receiver, true) : {}) : (members?.length > 1 ? startGroupCall(members, true) : {}) }}
                        >
                            <FaVideo />
                            Video
                        </button>
                        {isGroup && <button type="button" className="profile-add-button" onClick={() => setOpenSelect(true)}>
                            <FaUserPlus />
                            Add
                        </button>}

                        {isGroup && <button className="profile-edit-button">
                            <FaEdit />
                            Edit
                        </button>}
                    </div>


                </div>

                {/* main  */}
                <div className="profile-main">
                    <button className="profile-main-button">
                        <FaBell className="profile-main-icon" />
                        <div>
                            <h3>Notifictions</h3>
                            <p>All</p>
                        </div>
                    </button>
                    <button className="profile-main-button">
                        <FaLock className="profile-main-icon" />
                        <div>
                            <h3>Encryption</h3>
                            <p>Messages and calls are end-to-end encrypted. Tap to learn more.</p>
                        </div>
                    </button>
                    <button className="profile-main-button">
                        <FaClock className="profile-main-icon" />
                        <div>
                            <h3>Disappearing messages</h3>
                            <p>off</p>
                        </div>
                    </button>
                    <button className="profile-main-button">
                        <FaUserLock className="profile-main-icon" />
                        <div>
                            <h3>Chat lock</h3>
                            <p>Lock and hide this chat from chats.</p>
                        </div>
                    </button>
                </div>

                {/* members  */}
                {isGroup && <div className="profile-members">
                    <p style={{ margin: ".5rem 1.5rem" }}>Members (<span style={{ color: "var(--primary-color)" }}>{members?.length}</span>)</p>
                    <UsersList data={members} select={"hide"} />
                </div>}

                {/* bottom  */}
                <div className="profile-bottom ">
                    <button className="profile-main-button">
                        <FaHeart className="profile-main-icon" />
                        <h3>Add to Favorites</h3>
                    </button>
                    {isGroup && <button className="profile-main-button" onClick={exitGroupButtonHandler}>
                        <FaRightFromBracket className="profile-main-icon" color="var(--danger-color)" />
                        <h3 style={{ color: "var(--danger-color)" }}>Exit Group</h3>
                    </button>}
                    {!isGroup && <button className="profile-main-button">
                        <FaUser className="profile-main-icon" color="var(--danger-color)" />
                        <h3 style={{ color: "var(--danger-color)" }}>Block User</h3>
                    </button>}
                    <button className="profile-main-button">
                        <FaThumbsDown className="profile-main-icon" color="var(--danger-color)" />
                        <h3 style={{ color: "var(--danger-color)" }}>Report {isGroup ? "Group" : "User"}</h3>
                    </button>

                </div>
            </div>
        </Layout >
    )
}

export default ChatProfile