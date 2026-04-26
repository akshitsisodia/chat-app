import "../../Styles/Buttons.css"
import { useAuth } from '../../Context/AuthContext'
import { FaRightFromBracket } from 'react-icons/fa6';

function LogoutButton() {
    const { me, logout } = useAuth();

    const logoutClickedHandler = () => {
        logout();
    }
    return (
        <button type='button' className='logout-button' onClick={logoutClickedHandler}>
            <img src={me?.photo} alt={me.name} />
            <div className="logout-content">
                <h3 className="aside-name">{me?.name}</h3>
                <span className="aside-name">User</span>
            </div>
            <FaRightFromBracket />
        </button>
    )
}

export default LogoutButton