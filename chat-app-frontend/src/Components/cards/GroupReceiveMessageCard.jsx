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
            const key = getCachedKey(chatId) || groupKey;

            if (!key) {
                console.warn("Key not ready yet");
                return;
            }

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
            }
        }

        decryptMessage();
    }, [chatId, message, nonce]);
    return <>
        <div className="receiveMessageCard">
            <span style={{
                fontSize: ".7rem", fontWeight: 600, color: "#aaa", padding: ".5rem"
            }}>{receiver?.name}</span>

            {data?.files?.length > 0 && <GroupFileList data={data.files} groupKey={groupKey} imageButtonClicked={imageButtonClicked} />
            }

            < p className="receiveMessageCard-content">
                {content || "..."}
            </p>

            <p className="sendMessageCard-seen">
                {formatted}
                {/* <FaCheckDouble color={data.seen ? "#00d0ff" : ""} /> */}
            </p>

        </div>
    </>

}

export default GroupReceiveMessageCard