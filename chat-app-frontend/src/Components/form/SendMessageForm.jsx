import nacl from "tweetnacl";
import * as util from "tweetnacl-util";

import "../../Styles/Form.css"
import { useEffect, useRef, useState } from "react";
import { FaArrowRight, FaImage, FaMicrophone, FaPaperclip, FaPause, FaPlus, FaVideo } from "react-icons/fa";
import { useUploadMutation } from "../../Hooks/useMutation";
import { encryptMessage } from "../../Hooks/useEncryptMessage";
import { useSocket } from "../../Context/SocketContext";
import AudioRecordingButton from "../buttons/AudioRecordingButton";
import { FaPaperPlane } from "react-icons/fa6";
import ChooseFileButton from "../buttons/ChooseFileButton";
import { useAuth } from "../../Context/AuthContext";
import encryptFile from "../../Util/encrypt/encryptFile";



function SendMessageForm({ id, receiver, content, setContent }) {
    const { logout } = useAuth();
    const { socket } = useSocket();
    const [chooseFile, setChooseFile] = useState(false);
    const [files, setFiles] = useState(null);
    const [startRecord, setStartRecord] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState("");

    const uploadMutation = useUploadMutation({ setFiles, setAudioUrl })

    const onContentChangeHandler = (e) => {
        setContent(e.target.value);
    }

    const fileInputHandler = async (e) => {
        const files = e.target.files;
        const formData = new FormData();

        for (let file of files) {
            const { encryptedBlob, encryptedKey, nonce, iv } = await encryptFile(file, receiver?.public_key);
            // Append everything to formData
            formData.append("files", encryptedBlob);
            formData.append("keys", encryptedKey);
            formData.append("nonces", nonce);
            formData.append("ivs", iv);
            formData.append("types", file.type);
            formData.append("names", file.name);
        }

        setFiles(formData)

        // preview files logic
        const preview = document.getElementById("preview");

        for (let file of files) {
            const url = URL.createObjectURL(file);

            if (file.type.startsWith("image/")) {
                const img = document.createElement("img");
                img.src = url;
                img.classList.add("preview-container");
                preview.appendChild(img);
                setChooseFile(false)
            } else if (file.type.startsWith("video/")) {
                const video = document.createElement("video");
                video.src = url;
                video.controls = true;
                video.classList.add("preview-container");
                preview.appendChild(video);
                setChooseFile(false)
            }
            else {
                const div = document.createElement("div");
                div.innerHTML = `📄 ${file.name}`;
                div.classList.add("preview-files-container");
                preview.appendChild(div);
                setChooseFile(false)

            }
        }
    }

    const onSubmitHandler = (e) => {
        e.preventDefault();
        setChooseFile(false)

        if (!content && !files) return

        if (files) {
            uploadMutation.mutate({
                id,
                files
            })
            document.getElementById("preview").innerHTML = "";
            return
        }

        const { encrypted, nonce } = encryptMessage(content, localStorage.getItem("privateKey"), receiver?.public_key);

        const data = {
            chatId: id,
            content: encrypted,
            nonce,
        }

        socket.emit("sendMessage", data)

        setContent("")

        document.getElementById("preview").innerHTML = "";
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            onSubmitHandler(e)
        }
    };



    return (
        <form className="sendMessageForm" onSubmit={onSubmitHandler}>
            <div id="preview" />
            <div id="preview-file" />
            {audioUrl && <audio controls src={audioUrl} />}

            <div className="sendMessageForm-main" >
                <div className="sendMessageForm-inputs">
                    {!isRecording && <ChooseFileButton fileInputHandler={fileInputHandler} chooseFile={chooseFile} setChooseFile={setChooseFile} />}
                    {!isRecording && <textarea type="text" className="sendMessageForm-input" rows={1} value={content} onClick={() => setChooseFile(false)} onKeyDown={handleKeyDown} onChange={onContentChangeHandler} placeholder="Type here..." />}
                    <AudioRecordingButton receiver={receiver} setFiles={setFiles} isRecording={isRecording} setAudioUrl={setAudioUrl} setIsRecording={setIsRecording} setChooseFile={setChooseFile} />
                </div>

                <button type="submit" className="sendMessageForm-send-button" disabled={uploadMutation.isPending || isRecording} >
                    {!uploadMutation.isPending && <FaPaperPlane color="#fff" />}
                    {uploadMutation.isPending && <div className="loader"></div>}
                </button>
            </div>
        </form>
    )
}

export default SendMessageForm