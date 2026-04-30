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

function GroupMessages({ bottomRef, id, content, messages, receivers }) {

    const [imageLink, setImageLink] = useState(null)
    // const [groupKey, setGroupKey] = useState(null)
    const [keyMap, setKeyMap] = useState({});

    const { me } = useAuth();
    const { data } = useQuery({
        queryKey: ["group-keys", id],
        queryFn: () => getGroupKeys({ id }),
    });
    const keys = data?.data?.keys ?? [];
    const latestVersion = data?.data?.latestVersion ?? 1;

    const imageButtonClicked = (data) => {
        setImageLink(data)
    }

    useEffect(() => {
        async function setupKey() {
            if (!keys.length) return;

            const privateKey = localStorage.getItem("privateKey");
            const map = {};

            for (const k of keys) {
                const rawKey = decryptGroupKey(
                    {
                        encryptedKey: k.encryptedKey,
                        nonce: k.nonce,
                        ephemeralPublicKey: k.ephemeralPublicKey,
                    },
                    privateKey
                );

                if (!rawKey) {
                    console.error("Failed to decrypt key version", k.version);
                    continue;
                }

                const cryptoKey = await importKey(rawKey);

                map[k.version] = cryptoKey;
            }


            setKeyMap(map);

            // optional cache
            setCachedKey(id, map);

            console.log("All group keys ready");
        }

        setupKey();
    }, [data, id]);




    return (
        <>
            <div ref={bottomRef} />
            {messages.length > 0 && messages.map((curr, i) => {
                const key = keyMap[curr.key_version ?? 1];

                if (!key) {
                    // optional: skip or show loading
                    return null;
                }

                const receiver = receivers.find(r => r.user_id === curr.sender_id)

                return (
                    <div key={curr.id} className="messages">
                        <div className={curr.sender_id === me.id ? "messages-send-container" : "messages-receive-container"}>

                            {/* {curr.sender_id === me.id && <FaCheck className="not-seen" color={curr.seen ? "#00d0ff" : "#00d0ff"} />} */}
                            {curr.sender_id === me.id ? (
                                < GroupSendMessageCard
                                    chatId={id}
                                    groupKey={key}
                                    nonce={curr?.nonce}
                                    message={curr?.content}
                                    data={curr}
                                    imageButtonClicked={imageButtonClicked}
                                />
                            ) : (
                                <>
                                    {<img className="message-receiver-image" src={receiver.photo} alt="" />}
                                    <GroupReceiveMessageCard
                                        chatId={id}
                                        groupKey={key}
                                        nonce={curr?.nonce}
                                        message={curr?.content}
                                        receiver={receiver}
                                        data={curr}
                                        imageButtonClicked={imageButtonClicked}
                                    />
                                </>
                            )}
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