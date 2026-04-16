import { useEffect, useState } from "react";
import { getCachedKey } from "../../Util/CachesKeyMap";
import { decryptGroupMessage } from "../../Util/crypto";
import base64ToUint8Array from "../../Util/base64ToUint8Array";



function GroupSendMessageCard({ chatId, groupKey, message, nonce }) {
  const [content, setContent] = useState("");

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

  return <p className="sendMessageCard">{content || "..."}</p>;
}

export default GroupSendMessageCard;