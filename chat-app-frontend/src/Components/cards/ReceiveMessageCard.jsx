import { FaCheck } from "react-icons/fa"
import { decryptMessage } from "../../Hooks/useEncryptMessage"

function ReceiveMessageCard({ message, nonce, sender }) {

  let content;
  content = decryptMessage(message, nonce, sender?.public_key, localStorage.getItem("privateKey"))

  return (
    <p className="receiveMessageCard">
      {content}
    </p>
  )
}

export default ReceiveMessageCard