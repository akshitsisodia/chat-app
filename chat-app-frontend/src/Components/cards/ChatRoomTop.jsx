import "../../Styles/Cards.css"
import { useNavigate } from 'react-router-dom';

function ChatRoomTop({ chat, children }) {
    const navigate = useNavigate();

    const imageClickedHandler = () => {
        navigate(`/chats/${chat?.chat_id}`)
    }
    const cardClickedHandler = () => {
        navigate(`/chats/${chat?.chat_id}`)
    }
    return (
        <div className="chatCard">
            <button className="chatCard-image" onClick={imageClickedHandler}>
                <img src={chat?.chat_photo} alt={chat?.chat_name} className="chat-photo" />
            </button>
            <button className="chatCard-content" onClick={cardClickedHandler}>
                <h4 className='chatCard-content-top'>{chat?.chat_name}</h4>
                <p className="chatCard-content-main">Group</p>
            </button>
            <div className="userCard-end">
                {children}
            </div>

        </div>
    )
}

export default ChatRoomTop