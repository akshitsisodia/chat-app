import "../../Styles/Ui.css"
import { useAuth } from '../../Context/AuthContext'
import { useEffect, useRef, useState } from "react"
import { FaCheck, FaXmark } from "react-icons/fa6"
import { FaCheckDouble } from "react-icons/fa"
import { setCachedKey } from "../../Util/CachesKeyMap"
import GroupSendMessageCard from "../cards/GroupSendMessageCard"
import GroupReceiveMessageCard from "../cards/GroupReceiveMessageCard"
import { useQuery } from "@tanstack/react-query"
import { decryptGroupKey, importKey } from "../../Util/crypto"
import { getGroupKeys } from "../../Services/chatsApi"
import FilesList from "../common/FilesList"
import GroupFileList from "../common/GroupFileList"

function GroupMessages({ id, content, messages, receivers }) {
    const bottomRef = useRef(null);

    const [imageLink, setImageLink] = useState(null)

    const { me } = useAuth();
    const { data } = useQuery({
        queryKey: ["group-keys", id],
        queryFn: () => getGroupKeys({ id }),
    });



    const imageButtonClicked = (data) => {
        setImageLink(data)
    }

    useEffect(() => {
        async function setupKey() {
            if (!data?.data) return;

            const privateKey = localStorage.getItem("privateKey");

            const {
                encryptedKey,
                nonce,
                ephemeralPublicKey,
            } = data.data;

            // decrypt group key
            const rawKey = decryptGroupKey(
                {
                    encryptedKey,
                    nonce,
                    ephemeralPublicKey,
                },
                privateKey
            );

            if (!rawKey) {
                console.error("Failed to decrypt key");
                return;
            }

            // import AES key
            const key = await importKey(rawKey);

            // store
            setCachedKey(id, key);

            console.log("Group key ready");
        }

        setupKey();
    }, [data, id]);

    useEffect(() => {
        bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
    }, [content, id]);

    return (
        <>
            <div ref={bottomRef} />
            {messages.length > 0 && messages.map((curr, i) => {
                const receiver = receivers.filter(r => r.user_id === curr.sender_id)
                return (
                    <div key={curr.id} className="messages">
                        <div className={curr.sender_id === me.id ? "messages-send-container" : "messages-receive-container"}>

                            {curr?.files?.length > 0 && <GroupFileList data={curr.files} chatId={id} receiver={receiver[0]?.public_key} imageButtonClicked={imageButtonClicked} />}

                            {curr.content && <>
                                {curr.sender_id === me.id ?
                                    < GroupSendMessageCard chatId={id} nonce={curr?.nonce} message={curr?.content} />
                                    :
                                    <GroupReceiveMessageCard chatId={id} nonce={curr?.nonce} message={curr?.content} receiver={receiver[0]} />}
                            </>}
                            {curr.sender_id === me.id && <FaCheck className="not-seen" color={curr.seen ? "#00d0ff" : "#00d0ff"} />}

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

export default GroupMessages