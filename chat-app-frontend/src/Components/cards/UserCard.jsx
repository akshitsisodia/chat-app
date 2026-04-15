import "../../Styles/Cards.css"
import { useNavigate } from 'react-router-dom'

function UserCard({ receiver, chatId, children }) {
    const navigate = useNavigate();


    const imageClickedHandler = () => {
        navigate(`/users/${receiver?.id}`)
    }
    const cardClickedHandler = () => {
        navigate(`/chats/${chatId}`)
    }
    return (
        <div className="chatCard">
            <button className="chatCard-image" onClick={imageClickedHandler}>
                <img src={receiver?.photo} alt={receiver?.name} className="chat-photo" />
            </button>
            <button className="chatCard-content" onClick={cardClickedHandler}>
                <h4 className='chatCard-content-top'>{receiver?.name}</h4>
                <p className="chatCard-content-main">{receiver?.email}</p>
            </button>
            <div className="userCard-end">
                {children}
            </div>

        </div>
    )
}

export default UserCard