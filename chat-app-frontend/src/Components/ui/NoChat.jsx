import { FaSearch } from "react-icons/fa"
import "../../Styles/Ui.css"
import { useNavigate } from "react-router-dom"
import { FaPlus } from "react-icons/fa6";

function NoChat() {
    const navigate = useNavigate();
    const searchClickedHandler = () => {
        navigate("/users")
    }
    return (
        <div className="noChat">
            <div className="noChat-button">
                <button type="button" className="noChat-search-button" onClick={searchClickedHandler} >
                    <FaSearch className="no-chat-searchIcon" />
                </button>
                <p className="noChat-button-name">Search User</p>
            </div>
            <div className="noChat-button">
                <button type="button" className="noChat-search-button" onClick={()=>navigate("/create-group")} >
                    <FaPlus className="no-chat-searchIcon" />
                </button>
                <p className="noChat-button-name">Create Group</p>
            </div>
        </div>
    )
}

export default NoChat