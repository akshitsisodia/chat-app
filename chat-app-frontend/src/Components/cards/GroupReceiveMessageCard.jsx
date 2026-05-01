import { useEffect, useState } from "react";
import { getCachedKey } from "../../Util/CachesKeyMap";
import { decryptGroupMessage } from "../../Util/crypto";
import GroupFileList from "../common/GroupFileList";

function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}
function GroupReceiveMessageCard({ chatId, message, groupKey, nonce, receiver, data, imageButtonClicked }) {
    const [content, setContent] = useState("");

    const cachedMap = getCachedKey(chatId) || {};
    const key = cachedMap[data.key_version ?? 1] || groupKey;


    const date = new Date(data?.created_at);
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

    useEffect(() => {
        async function decryptMessage() {

            if (!key) {
                setContent("🔒");
                return;
            }
            if (data.message_type !== 'user') return

            const ciphertext = base64ToUint8Array(message);
            const iv = base64ToUint8Array(nonce);

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
    }, [chatId, message, nonce, data.key_version, key]);

    return (
        <>
            {data?.message_type === 'system' &&
                <div className="receiveSystemMessageCard">
                    <p>
                        {data.content}
                    </p>&nbsp;
                    <span >
                        {formatted}
                    </span>
                </div>
            }

            {data?.message_type === 'user' && <div className="receiveMessageCard">
                <span style={{
                    fontSize: ".7rem", fontWeight: 600, color: "#aaa", padding: "0rem .2rem", textTransform: "capitalize"
                }}>{receiver?.name}</span>

                {data?.files?.length > 0
                    &&
                    <GroupFileList
                        data={data.files}
                        groupKey={key}
                        imageButtonClicked={imageButtonClicked}
                    />
                }

                < p className="receiveMessageCard-content">
                    {content || "..."}
                </p>


                <p className="sendMessageCard-seen">
                    {formatted}
                    {/* <FaCheckDouble color={data.seen ? "#00d0ff" : ""} /> */}
                </p>

            </div >
            }
        </>
    )

}

export default GroupReceiveMessageCard