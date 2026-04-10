import ChatCard from "../cards/ChatCard"
import ButtonFirstMessage from "./ButtonFirstMessage"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import Loading from "../ui/Loading";

function UsersList({ data, isLoading, chatCard, activeId }) {

    const navigate = useNavigate();
    const imageClickedHandler = (id) => {
        navigate(`/users/${id}`)
    }
    const cardClickedHandler = (id) => {
        navigate(`/users/${id}`)
    }


    if (isLoading) return <Loading />
    return (
        <>
            {data?.length > 0 && data?.map(curr => {
                return (
                    <div key={curr.id} className={activeId && activeId === curr.user_id ? "users-card-active users-card" : 'users-card'}  >

                        {/* <hr /> */}
                        <div className="chatCard">
                            <button className="chatCard-image" onClick={() => imageClickedHandler(curr.id)}>
                                <img src={curr?.photo} alt={curr?.name} className="chat-photo" />
                            </button>
                            <button className="chatCard-content" onClick={() => cardClickedHandler(curr.id)}>
                                <h4 className='chatCard-content-top'>{curr?.name}</h4>
                                <p className="chatCard-content-main">{curr?.email}</p>
                            </button>
                            <div className="userCard-end">
                                <ButtonFirstMessage id={curr.id} user={curr}>
                                    Message
                                </ButtonFirstMessage>
                            </div>

                        </div>
                    </div>
                )
            })}

            {data?.length === 0 && <p className="usersList-empty">No User Found!</p>}
        </>
    )
}

export default UsersList