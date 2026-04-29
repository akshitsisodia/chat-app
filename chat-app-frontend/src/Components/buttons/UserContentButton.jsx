import { useNavigate } from "react-router-dom";
import "../../Styles/Buttons.css"

function UserContentButton({ name, email, chatId }) {
    const navigate = useNavigate();
    const cardClickedHandler = () => {
        navigate(`/chats/${chatId}`)
    }
    return (
        <button className="user-content-button" onClick={cardClickedHandler}>
            <h3 className='chatCard-content-top'>{name}</h3>
            {email && <p className="chatCard-content-main">{email}</p>}
        </button>
    )
}

export default UserContentButton