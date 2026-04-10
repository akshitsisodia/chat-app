import ChatCard from '../cards/ChatCard';
import Loading from '../ui/Loading';

function ChatsList({ data, isLoading, activeId }) {

    if (isLoading) return <Loading />
    return (
        <>
            {data?.length > 0 && data?.map(curr => {
                return (
                    <div key={curr.chat_id} className={activeId && activeId === curr.user_id ? "users-card-active users-card" : 'users-card'}  >
                        <ChatCard data={curr} />
                    </div>
                )
            })}

            {data?.length === 0 && <p className="usersList-empty">No User Found!</p>}
        </>
    )
}

export default ChatsList