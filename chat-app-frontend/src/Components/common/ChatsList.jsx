import ChatCard from '../cards/ChatCard';
import GroupCard from '../cards/GroupCard';
import Loading from '../ui/Loading';

function ChatsList({ data, isLoading, activeId }) {

    if (isLoading) return <Loading />
    return (
        <>
            {data?.length > 0 && data?.map(curr => {
                return (
                    <div key={curr.chat_id} className={activeId && activeId === curr.chat_id ? "users-card-active" : ''}  >
                        {curr.type === "private" && <ChatCard data={curr} />}
                        {curr.type === "group" && <GroupCard data={curr} />}
                    </div>
                )
            })}

            {data?.length === 0 && <p className="usersList-empty">No User Found!</p>}
        </>
    )
}

export default ChatsList