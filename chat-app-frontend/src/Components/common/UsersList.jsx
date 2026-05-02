import ButtonFirstMessage from "./ButtonFirstMessage"
import { useLocation, useNavigate } from "react-router-dom";

function UsersList({ data, select, activeId, memberIds, setMembers, role }) {

    const navigate = useNavigate();
    const location = useLocation();
    const fallbackPhoto = "https://i.pinimg.com/736x/62/01/0d/62010d848b790a2336d1542fcda51789.jpg";

    const imageClickedHandler = (id) => {
        navigate(`/users/${id}${location.search}`)
    }

    const cardClickedHandler = (id) => {
        navigate(`/users/${id}${location.search}`)
    }

    return (
        <div className={`users-list ${select ? "users-list-select" : ""}`}>
            {data?.length > 0 && data?.map(curr => {
                const isAdded = memberIds?.includes(curr.id) || select === "selected";
                const isActive = activeId && String(activeId) === String(curr.user_id || curr.id);

                return (
                    <article key={curr.id} className={isActive ? "users-card-active users-card" : 'users-card'}  >
                        <button className="users-card-image" onClick={() => select ? "" : imageClickedHandler(curr.id)}>
                            <img src={curr?.photo || fallbackPhoto} alt={curr?.name || "User"} />
                        </button>
                        {role && <p className={curr?.role === 'admin' ? "user-card-role-admin" : "user-card-role"}>{curr?.role}</p>}
                        <button className="users-card-content" onClick={() => select ? "" : cardClickedHandler(curr.id)}>
                            <h4>{curr?.name}</h4>
                            <p>{curr?.email}</p>
                        </button>

                        {!select && (
                            <div className="userCard-end">
                                <ButtonFirstMessage id={curr.id} user={curr}>
                                    Message
                                </ButtonFirstMessage>
                            </div>
                        )}

                        {select && select !== "hide" && (
                            <button
                                type="button"
                                className={`user-list-select-button ${isAdded ? "user-list-select-button-added" : ""}`}
                                onClick={() => isAdded ? setMembers(prev => prev.filter(m => m.id !== curr.id)) : setMembers(prev => [...prev, curr])}
                            >
                                {isAdded ? (select === "remove" ? "Remove" : "Added") : "Add"}
                            </button>
                        )}
                    </article>
                )
            })}

            {data?.length === 0 && <p className="usersList-empty">No User Found!</p>}
        </div>
    )
}

export default UsersList
