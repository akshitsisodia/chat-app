import ChatCard from "../cards/ChatCard"
import ButtonFirstMessage from "./ButtonFirstMessage"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import Loading from "../ui/Loading";

function UsersList({ data, select, activeId, memberIds, setMembers }) {

    const navigate = useNavigate();
    const imageClickedHandler = (id) => {
        navigate(`/users/${id}`)
    }
    const cardClickedHandler = (id) => {
        navigate(`/users/${id}`)
    }


    return (
        <>
            {data?.length > 0 && data?.map(curr => {
                return (
                    <div key={curr.id} className={activeId && activeId === curr.user_id ? "users-card-active users-card" : 'users-card'}  >

                        {/* <hr /> */}
                        <div className="chatCard">
                            <button className="chatCard-image" onClick={() => select ? "" : imageClickedHandler(curr.id)}>
                                <img src={curr?.photo} alt={curr?.name} className="chat-photo" />
                            </button>
                            <button className="chatCard-content" onClick={() => select ? "" : cardClickedHandler(curr.id)}>
                                <h4 className='chatCard-content-top'>{curr?.name}</h4>
                                <p className="chatCard-content-main">{curr?.email}</p>
                            </button>
                            {!select && <div className="userCard-end">
                                <ButtonFirstMessage id={curr.id} user={curr}>
                                    Message
                                </ButtonFirstMessage>
                            </div>}
                            {select && select !== "hide" && <button type="button" className="user-list-select-button" style={memberIds?.includes(curr.id) || select === "selected" ? { backgroundColor: "var(--primary-color)", color: "#fff", border: "none" } : {}} onClick={() => memberIds?.includes(curr.id) || select === "selected" ? "" : setMembers(prev => [...prev, curr])}>{memberIds?.includes(curr.id) || select === "selected" ? "Added" : "Add"}</button>}

                        </div>
                    </div>
                )
            })}

            {data?.length === 0 && <p className="usersList-empty">No User Found!</p>}
        </>
    )
}

export default UsersList