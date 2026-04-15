import { useEffect, useState } from "react";
import { decryptFile } from "../../Hooks/useEncryptFiles";
import Loading from "./Loading";
import { getCachedKey } from "../../Util/CachesKeyMap";
import base64ToUint8Array from "../../Util/base64ToUint8Array";

function GroupFilePreview({ file, chatId, receiver, imageButtonClicked }) {

    const [url, setUrl] = useState(null);

    useEffect(() => {
        const loadFile = async () => {
            const privateKey = localStorage.getItem("privateKey");
            const key = await getCachedKey(chatId);
            if (!key) {
                console.warn("Key not ready yet");
                return;
            }
            if (!privateKey) return;
            const res = await fetch(file.url);
            const encryptedBuffer = await res.arrayBuffer();
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: base64ToUint8Array(file.iv),
                },
                key,
                encryptedBuffer,
            );


            if (!decrypted) return;

            const blob = new Blob([decrypted], { type: file.type });
            const objectUrl = URL.createObjectURL(blob);

            setUrl(objectUrl);
        };

        loadFile();

        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [file]);


    if (!url) return <Loading />;

    // 📷 Image
    if (file.type.startsWith("image/")) {
        return (
            <button type="button" onClick={() => imageButtonClicked(url)} className="messages-image-container" >
                <img src={url} style={{ maxWidth: "200px" }} />
            </button>
        );
    }

    // 🎥 Video
    if (file.type.startsWith("video/")) {
        return <video src={url} controls />;
    }

    //     Audio
    if (file?.type?.startsWith("audio/")) {
        return <audio src={url} controls style={{ width: "250px", height: "40px" }} />
    }

    // 📄 Other
    return (
        <a href={url} download={file.name} className="pdf-container-link">
            <span>📄{file.name}</span>
            <p>Download {file.type}</p>
            {/* 📄 Download {file.name} */}
        </a>
    );

}

export default GroupFilePreview