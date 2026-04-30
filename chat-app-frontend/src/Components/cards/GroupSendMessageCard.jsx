import { useEffect, useState } from "react";
import { getCachedKey } from "../../Util/CachesKeyMap";
import { decryptGroupMessage } from "../../Util/crypto";
import base64ToUint8Array from "../../Util/base64ToUint8Array";
import { FaCheck, FaCheckDouble } from "react-icons/fa";
import GroupFileList from "../common/GroupFileList";



function GroupSendMessageCard({ chatId, groupKey, message, nonce, data, imageButtonClicked }) {
  const [content, setContent] = useState("");

  const date = new Date(data?.created_at);
  const now = Date.now();
  const diff = now - date.getTime();
  const isWithin24h = diff < 24 * 60 * 60 * 1000;

  const cachedMap = getCachedKey(chatId) || {};
  const key = cachedMap[data.key_version ?? 1] || groupKey;

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
    <div className="sendMessageCard">
      {data?.files?.length > 0
        &&
        <GroupFileList
          data={data.files}
          groupKey={key}
          imageButtonClicked={imageButtonClicked}
        />
      }

      {data?.message_type === 'user' && <p className="sendMessageCard-content">
        {content || "..."}
      </p>}
      {data?.message_type === 'system' && < p className="sendMessageCard-content" style={{ color: "var(--danger-color)" }}>
        {data.content}
      </p>}

      <p className="sendMessageCard-seen">
        {formatted}
        <FaCheck color={data.seen ? "#00d0ff" : ""} />
      </p>
    </div>
  );
}

export default GroupSendMessageCard;