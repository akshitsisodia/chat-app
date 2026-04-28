import { useNavigate } from "react-router-dom";
import "../../Styles/Buttons.css"

function UserContentButton({ data, chatId }) {
    const navigate = useNavigate();
    const cardClickedHandler = () => {
        navigate(`/chats/${chatId}`)
    }
    return (
        <button className="user-content-button" onClick={cardClickedHandler}>
            <h3 className='chatCard-content-top'>{data?.chat_name}</h3>
            <p className="chatCard-content-main">{data?.email}</p>
        </button>
    )
}

export default UserContentButton