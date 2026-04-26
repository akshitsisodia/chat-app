import { useNavigate } from "react-router-dom"
import "../../Styles/Buttons.css"

function UserImageButton({ receiver }) {
    const navigate = useNavigate();
    const imageClickedHandler = () => {
        navigate(`/users/${receiver?.id}`)
    }
    return (
        <button className="user-image-button" onClick={imageClickedHandler}>
            <img src={receiver?.photo} alt={receiver?.name} />
        </button>
    )
}

export default UserImageButton