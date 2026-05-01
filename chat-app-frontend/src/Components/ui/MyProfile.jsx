import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaImage, FaPlus, FaRightFromBracket, FaUser } from "react-icons/fa6";
import { FaEdit, FaSearch } from "react-icons/fa";
import { useAuth } from "../../Context/AuthContext";
import "../../Styles/Ui.css";
import Layout from "../layout/Layout";
import { useState } from "react";
import UpdatePhotoModel from "../model/UpdatePhotoModel";
import NoChat from "./NoChat";
import LogoutButton from "../buttons/LogoutButton";

function MyProfile() {
    const { me, isLoading, error, logout } = useAuth();
    const navigate = useNavigate();
    const [openUpdatePhoto, setOpenUpdatePhoto] = useState(false)

    const fallbackPhoto = "https://i.pinimg.com/736x/62/01/0d/62010d848b790a2336d1542fcda51789.jpg";

    if (isLoading) {
        return (
            <div className="my-profile my-profile-state">
                <div className="spinner"></div>
                <p className="muted">Loading your profile...</p>
            </div>
        )
    }

    if (error || !me) {
        return (
            <div className="my-profile my-profile-state">
                <div className="my-profile-state-icon">
                    <FaUser />
                </div>
                <h3>Profile unavailable</h3>
                <p className="muted">Your details could not be loaded right now.</p>
            </div>
        )
    }

    return (
        <div className="my-profile">
            {openUpdatePhoto && <UpdatePhotoModel onClose={() => setOpenUpdatePhoto(false)} />}
            <div className="my-profile-logout">
                Logout <FaRightFromBracket />
            </div>

            <div className="my-profile-greeting">
                <h1>Hello, {me.name?.split(" ")[0] || "User"}</h1>
                <p>Welcome back to your dashboard</p>
            </div>

            <section className="my-profile-content">
                <div className="my-profile-avatar-wrap">
                    <img src={me.photo || fallbackPhoto} alt={me.name || "My profile"} className="my-profile-avatar" />
                </div>

                <div className="my-profile-heading">
                    <span className="my-profile-badge">My profile</span>
                    <h2>{me.name || "Your account"}</h2>
                    <p><FaEnvelope /> <span>{me.email || "No email available"}</span></p>
                </div>

                <div className="my-profile-actions">
                    <button type="button" onClick={() => setOpenUpdatePhoto(true)}>
                        <FaImage />
                        <span>Update Photo</span>
                    </button>
                    <button type="button">
                        <FaEdit />
                        <span>Edit Profile</span>
                    </button>
                </div>
            </section>

            {/* <NoChat /> */}
        </div>
    )
}

export default MyProfile;
