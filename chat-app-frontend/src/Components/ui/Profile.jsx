import { useQuery } from '@tanstack/react-query'

import "../../Styles/Ui.css"
import { getUserById } from '../../Services/userAPI'
import { FaEnvelope, FaUser } from 'react-icons/fa6'
import ButtonFirstMessage from '../common/ButtonFirstMessage'
import ButtonGoBack from '../common/ButtonGoBack'

function Profile({ id }) {

    const { data, isLoading, error } = useQuery({
        queryKey: ["user", id],
        queryFn: () => getUserById(id)
    })
    const user = data?.data ?? {};
    const fallbackPhoto = "https://i.pinimg.com/736x/62/01/0d/62010d848b790a2336d1542fcda51789.jpg";

    if (isLoading) {
        return (
            <div className="profile profile-state">
                <div className="spinner"></div>
                <p className="muted">Loading profile...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="profile profile-state">
                <div className="profile-state-icon">
                    <FaUser />
                </div>
                <h3>Profile unavailable</h3>
                <p className="muted">We could not load this user's details right now.</p>
            </div>
        )
    }

    return (
        <div className="profile">
            <div className="profile-mobile-back">
                <ButtonGoBack />
            </div>
            <section className="profile-card">
                <div className="profile-content">
                    <img src={user.photo || fallbackPhoto} alt={user?.name || "User profile"} className="profile-image" />

                    <div className="profile-name">
                        <h3>{user?.name || "Unknown user"}</h3>
                        <p><FaEnvelope /> <span>{user?.email || "No email available"}</span></p>
                    </div>

                    <div className="profile-actions">
                        <ButtonFirstMessage id={id}>
                            Send Message
                        </ButtonFirstMessage>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Profile
