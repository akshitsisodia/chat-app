import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaPlus, FaUser } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useAuth } from "../../Context/AuthContext";
import "../../Styles/Ui.css";

function MyProfile() {
    const { me, isLoading, error } = useAuth();
    const navigate = useNavigate();
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
                    <button type="button" onClick={() => navigate("/users")}>
                        <FaSearch />
                        <span>Find people</span>
                    </button>
                    <button type="button" onClick={() => navigate("/create-group")}>
                        <FaPlus />
                        <span>Create group</span>
                    </button>
                </div>
            </section>
        </div>
    )
}

export default MyProfile;
