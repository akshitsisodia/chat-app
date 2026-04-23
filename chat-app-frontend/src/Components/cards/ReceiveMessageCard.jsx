import { FaCheck } from "react-icons/fa"
import { decryptMessage } from "../../Hooks/useEncryptMessage"
import FilesList from "../common/FilesList";
import { FaCheckDouble } from "react-icons/fa6";

function ReceiveMessageCard({ message, nonce, sender, data, imageButtonClicked }) {

  
  let content;
  if (message) {
    content = decryptMessage(message, nonce, sender?.public_key, localStorage.getItem("privateKey"))
  }

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

  return (
    <div className="receiveMessageCard">
      {data?.files?.length > 0 && < FilesList data={data.files} public_key={sender.public_key} imageButtonClicked={imageButtonClicked} />}

      <p className="receiveMessageCard-content">
        {content}
      </p>
      <p className="sendMessageCard-seen">
        {formatted}
        {/* <FaCheckDouble color={data.seen ? "#00d0ff" : ""} /> */}
      </p>
    </div>
  )
}

export default ReceiveMessageCard