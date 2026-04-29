import { useNavigate } from "react-router-dom"
import "../../Styles/Buttons.css"

function UserImageButton({ photo, name, id }) {
    const navigate = useNavigate();
    const imageClickedHandler = () => {
        navigate(`/users/${id}`)
    }
    return (
        <button className="user-image-button" onClick={id ? imageClickedHandler : () => { }}>
            <img src={photo} alt={name} />
        </button>
    )
}

export default UserImageButton