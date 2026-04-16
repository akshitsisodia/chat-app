import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { decryptGroupMessage } from '../../Util/crypto';
import { useEffect, useState } from 'react';
import { getCachedKey } from '../../Util/CachesKeyMap';
import base64ToUint8Array from '../../Util/base64ToUint8Array';

function GroupCard({ data }) {
    const navigate = useNavigate();
    const [content, setContent] = useState("");

    useEffect(() => {
        async function decryptMessage() {
            const key = getCachedKey(data.chat_id);

            if (!key) {
                console.warn("Key not ready yet");
                if (data.unread_count > 0) {
                    setContent("newMessage")
                }
                return;
            }
            if (!data?.last_message) {
                return
            }
            const ciphertext = base64ToUint8Array(data?.last_message);
            const iv = base64ToUint8Array(data?.nonce);


            try {
                const text = await decryptGroupMessage(
                    key,
                    ciphertext,
                    iv
                );

                setContent(text);
            } catch (err) {
                console.error("Decryption failed", err);
            }
        }

        decryptMessage();
    }, [data.last_message]);



    const imageClickedHandler = () => {
        // navigate(`/users/${data.user_id}`)
    }
    const cardClickedHandler = async () => {
        // await queryClient.invalidateQueries(["user"])
        navigate(`/my-groups/${data.chat_id}`)
    }
    const date = new Date(data?.last_message_time)
    const time = `${date.getHours()}:${date.getMinutes().toString().length < 2 ? "0" + date.getMinutes().toString() : date.getMinutes().toString()}`

    return (
        <div className="chatCard">
            <button className="chatCard-image" onClick={imageClickedHandler}>
                <img src={data.chat_photo} alt={data.chat_name} className="chat-photo" />
            </button>
            <button className="chatCard-content" onClick={cardClickedHandler}>
                <h4 className='chatCard-content-top'>{data.chat_name}</h4>
                {content && <p className="chatCard-content-main">{content}</p>}
            </button>
            <div className="chatCard-detail">
                {time && <p className="chatCard-detail-time">{time}</p>}
                {data.unread_count > 0 && <p className="chatCard-detail-unreads">{data.unread_count}</p>}
            </div>

        </div>
    )
}

export default GroupCard