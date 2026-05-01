import { FaRegUserCircle, FaSearch, FaUserCircle } from "react-icons/fa"
import "../../Styles/Ui.css"
import { useNavigate } from "react-router-dom"
import { FaMessage, FaPlus } from "react-icons/fa6";

function NoChat() {
    const navigate = useNavigate();
    const searchClickedHandler = () => {
        navigate("/users")
    }
    return (
        <div className="noChat">

            <div className="noChat-logo-container">
                <FaMessage />
            </div>
            <h3>No Previous Chats.</h3>
            <div>
                <p style={{ textAlign: "center" }}>Click here to find users or</p>
                <p style={{ textAlign: "center" }}>to create group.</p>
            </div>

            <button type="button" onClick={searchClickedHandler} >
                <FaPlus />
                <span>Find Users</span>
            </button>
            

            {/* <div className="noChat-button">
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
            </div> */}
        </div>
    )
}

export default NoChat