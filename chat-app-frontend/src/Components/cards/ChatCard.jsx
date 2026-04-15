import "../../Styles/Cards.css"
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../Context/AuthContext';
import { decryptMessage } from '../../Hooks/useEncryptMessage';
import { FaCheck, FaCheckDouble } from "react-icons/fa6";

function ChatCard({ data }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    let content
    if (data?.last_message) {
        content = decryptMessage(data?.last_message, data?.nonce, data?.public_key, localStorage.getItem("privateKey"));
    }

    const imageClickedHandler = () => {
        navigate(`/users/${data.user_id}`)
    }
    const cardClickedHandler = async () => {
        await queryClient.invalidateQueries(["user"])
        navigate(`/${data.chat_id}`)

    }
    const date = new Date(data.last_message_time)
    const time = `${date.getHours()}:${date.getMinutes().toString().length < 2 ? "0" + date.getMinutes().toString() : date.getMinutes().toString()}`

    return (
        <div className="chatCard">
            <button className="chatCard-image" onClick={imageClickedHandler}>
                <img src={data.photo} alt={data.name} className="chat-photo" />
            </button>
            <button className="chatCard-content" onClick={cardClickedHandler}>
                <h4 className='chatCard-content-top'>{data.name}</h4>
                {content && <p className="chatCard-content-main">{content}</p>}
            </button>
            <div className="chatCard-detail">
                <p className="chatCard-detail-time">{time}</p>
                {data.unread_count > 0 && <p className="chatCard-detail-unreads">{data.unread_count}</p>}
                {/* {data.unread_count > 0 && <p className="chatCard-detail-seen"><FaCheck color="#ccc" /></p>} */}
                {/* {!data.unread_count && <p className="chatCard-detail-seen"><FaCheckDouble color="#00d0ff" /></p>} */}
            </div>

        </div>
    )
}

export default ChatCard