import { decryptMessage } from "../../Hooks/useEncryptMessage"
import "../../Styles/Cards.css"
function SendMessageCard({ receiver, message, nonce }) {
    const content = decryptMessage(message, nonce, receiver?.public_key, localStorage.getItem("privateKey"))
    return (
        <p className="sendMessageCard">
            {content}
        </p>
    )
}

export default SendMessageCard