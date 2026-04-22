import "../../Styles/Ui.css"
import SendMessageCard from '../cards/SendMessageCard'
import ReceiveMessageCard from '../cards/ReceiveMessageCard'
import { useAuth } from '../../Context/AuthContext'
import { useEffect, useRef, useState } from "react"
import { FaXmark } from "react-icons/fa6"
import { FaCheckDouble } from "react-icons/fa"
import FilesList from "../common/FilesList"
import IncommingCard from "../cards/IncommingCard"
import OutgoingCard from "../cards/OutgoingCard"


function Messages({ id, receiver, content, messages }) {
    const bottomRef = useRef(null);

    const [imageLink, setImageLink] = useState(null)

    const { me } = useAuth();

    useEffect(() => {
        bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
    }, [content, id]);

    const imageButtonClicked = (data) => {
        setImageLink(data)
    }

    return (
        <>
            <div ref={bottomRef} />
            {messages.length > 0 && messages.map((curr, i) => {

                return (
                    <div key={curr.id} className="messages">
                        <div className={curr.sender_id === me.id ? "messages-send-container" : "messages-receive-container"}>
                            {/* load files  */}
                            {/* {curr?.files?.length > 0 && <FilesList data={curr.files} public_key={receiver.public_key} imageButtonClicked={imageButtonClicked} />} */}
                            {/* load message  */}
                            {/* {curr.content && <> */}
                            {/* {curr.sender_id === me.id && <FaCheckDouble className="not-seen" color={curr.seen ? "#00d0ff" : ""} />} */}
                            {curr.sender_id === me.id
                                ?
                                <>
                                    {/* <OutgoingCard /> */}
                                    < SendMessageCard receiver={receiver} nonce={curr?.nonce} message={curr?.content} data={curr} imageButtonClicked={imageButtonClicked} />
                                    {/* {curr.sender_id === me.id && <img className="message-sender-image" src={me.photo} alt="" />} */}
                                </>

                                :
                                <>
                                    {/* <IncommingCard /> */}
                                    {<img className="message-receiver-image" src={me.photo} alt="" />}
                                    <ReceiveMessageCard sender={receiver} nonce={curr?.nonce} message={curr?.content} data={curr} imageButtonClicked={imageButtonClicked} />
                                </>
                            }
                            {/* </>} */}


                        </div>
                    </div >
                )

            })}

            {/* open image model */}
            {imageLink &&
                <div className="messages-image-open">
                    <button className="messages-image-close" onClick={() => setImageLink(null)}>
                        <FaXmark />
                    </button>
                    <img src={imageLink} alt="image" />
                </div>
            }

        </>
    )
}

export default Messages