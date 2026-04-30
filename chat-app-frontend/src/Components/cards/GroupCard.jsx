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
            const keyMap = getCachedKey(data.chat_id) || {};
            const key = keyMap[data.key_version ?? 1];

            if (!key) {
                if (data.unread_count > 0) {
                    setContent("🔒 New message");
                } else {
                    setContent("");
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
                setContent("❌");
            }
        }

        decryptMessage();
    }, [data.last_message, data?.key_version]);



    const imageClickedHandler = () => {
        navigate(`/chats/${data.chat_id}`)
    }
    const cardClickedHandler = async () => {
        navigate(`/my-groups/${data?.chat_id}`)
    }

    // date 
    const date = new Date(data?.last_message_time);
    const now = Date.now();
    const diff = now - date.getTime();
    const isWithin24h = diff < 24 * 60 * 60 * 1000;

    let formatted;

    if (isWithin24h) {
        // show time
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");

        formatted = `${hours}:${minutes}`;
    } else {
        // show date (you can customize format)
        formatted = date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short"
        });
    }
    // date 
    // const date = new Date(data?.last_message_time)
    // const time = `${date.getHours()}:${date.getMinutes().toString().length < 2 ? "0" + date.getMinutes().toString() : date.getMinutes().toString()}`

    return (
        <div className="chatCard" onClick={cardClickedHandler}>
            <button
                className="chatCard-image"
            // onClick={imageClickedHandler}
            >
                <img src={data.chat_photo} alt={data.chat_name} className="chat-photo" />
            </button>
            <button className="chatCard-content" >
                <h4 className='chatCard-content-top'>{data.chat_name}</h4>
                {content && <p className="chatCard-content-main">{content}</p>}
            </button>
            <div className="chatCard-detail">
                {data?.last_message_time && <p className="chatCard-detail-time">{formatted}</p>}
                {data.unread_count > 0 && <p className="chatCard-detail-unreads">{data.unread_count}</p>}
            </div>

        </div>
    )
}

export default GroupCard