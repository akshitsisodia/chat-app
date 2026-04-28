import { useNavigate } from "react-router-dom"
import "../../Styles/Buttons.css"

function UserImageButton({ data }) {
    const navigate = useNavigate();
    const imageClickedHandler = () => {
        navigate(`/users/${data?.id}`)
    }
    return (
        <button className="user-image-button" onClick={imageClickedHandler}>
            <img src={data?.chat_photo} alt={data?.chat_name} />
        </button>
    )
}

export default UserImageButton