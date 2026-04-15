import { useEffect, useState } from "react";
import { getCachedKey } from "../../Util/CachesKeyMap";
import { decryptGroupMessage } from "../../Util/crypto";

function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}
function GroupReceiveMessageCard({ chatId, message, nonce, receiver }) {
    const [content, setContent] = useState("");

    useEffect(() => {
        async function decryptMessage() {
            const key = getCachedKey(chatId);

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
    console.log
    return <>
        <div className="receiveMessageCard">
            <span style={{fontSize:".7rem", fontWeight:600, color:"#aaa"}}>{receiver?.name}</span>
            <p >{content || "..."}</p>
        </div>
    </>

}

export default GroupReceiveMessageCard