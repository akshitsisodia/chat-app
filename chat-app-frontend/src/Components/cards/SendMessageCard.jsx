import { FaCheckDouble } from "react-icons/fa6"
import { decryptMessage } from "../../Hooks/useEncryptMessage"
import "../../Styles/Cards.css"
import FilesList from "../common/FilesList"
function SendMessageCard({ receiver, message, nonce, data, imageButtonClicked }) {
    let content
    if (message) {
        content = decryptMessage(message, nonce, receiver?.public_key, localStorage.getItem("privateKey"))
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
        <div className="sendMessageCard">
            {data?.files?.length > 0 && < FilesList data={data.files} public_key={receiver.public_key} imageButtonClicked={imageButtonClicked} />}

            {content && <p className="sendMessageCard-content">
                {content}
            </p>}
            <p className="sendMessageCard-seen">
                {formatted}
                <FaCheckDouble color={data.seen ? "#00d0ff" : ""} />
            </p>
        </div>
    )
}

export default SendMessageCard