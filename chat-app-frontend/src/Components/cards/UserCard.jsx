import "../../Styles/Cards.css"
import { useNavigate } from 'react-router-dom'
import UserImageButton from "../buttons/UserImageButton";
import UserContentButton from "../buttons/UserContentButton";

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
            <UserImageButton receiver={receiver} />
            {/* <button className="chatCard-content" onClick={cardClickedHandler}>
                <h4 className='chatCard-content-top'>{receiver?.name}</h4>
                <p className="chatCard-content-main">{receiver?.email}</p>
            </button> */}
            <UserContentButton receiver={receiver} chatId={chatId} />
            <div className="userCard-end">
                {children}
            </div>

        </div>
    )
}

export default UserCard