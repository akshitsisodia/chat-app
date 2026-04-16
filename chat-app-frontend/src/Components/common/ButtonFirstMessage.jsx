import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getOrCreateChat } from '../../Services/chatsApi';
import { useState } from 'react';

function ButtonFirstMessage({ id, user, children }) {
    const navigate = useNavigate();
    const [clicked, setClicked] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ["chatId"],
        queryFn: () => getOrCreateChat({ id }),
        enabled: clicked

    })

    const buttonClickedHandler = async (e) => {
        const data = await getOrCreateChat({ id })
        navigate(`/${data?.data}`)

    }
    return (
        <button type='button' onClick={buttonClickedHandler} className="buttonFirstMessage">
            {children}
        </button>
    )
}

export default ButtonFirstMessage