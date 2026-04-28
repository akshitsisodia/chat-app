import { useEffect, useState } from "react";
import { decryptFile } from "../../Hooks/useEncryptFiles";
import Loading from "./Loading";
import { FaExclamation } from "react-icons/fa6";

const FilePreview = ({ file, senderPublicKey, imageButtonClicked }) => {
    const [url, setUrl] = useState(null);
    const [error, setError] = useState(null);


    useEffect(() => {
        const loadFile = async () => {
            const privateKey = localStorage.getItem("privateKey");

            if (!privateKey) return;

            const decrypted = await decryptFile({
                fileUrl: file.url,
                encryptedKey: file.encrypted_key,  //aesKey
                nonce: file.file_nonce,
                iv: file.iv,
                senderPublicKey,
                receiverPrivateKey: privateKey,
            });


            if (!decrypted) {
                setError("Failed to decrypt file");
                return;
            }

            const blob = new Blob([decrypted], { type: file.type });
            const objectUrl = URL.createObjectURL(blob);

            setUrl(objectUrl);
        };

        loadFile();

        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [file]);

    if (error) return <div className="file-error" style={{ padding: ".5rem" }}><FaExclamation color="var(--danger-color)" />{error}</div>;
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
        return <audio src={url} controls />
    }

    // 📄 Other
    return (
        <a href={url} download={file.name} className="pdf-container-link">
            <span>📄{file.name}</span>
            <p>Download {file.type}</p>
            {/* 📄 Download {file.name} */}
        </a>
    );
};

export default FilePreview;