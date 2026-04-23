import nacl from "tweetnacl";
import * as util from "tweetnacl-util";

import "../../Styles/Form.css"
import { useEffect, useRef, useState } from "react";
import { FaArrowRight, FaImage, FaMicrophone, FaPaperclip, FaPaperPlane, FaPause, FaPlus, FaVideo } from "react-icons/fa";
import { useUploadMutation } from "../../Hooks/useMutation";
import { encryptGroupMessage } from "../../Util/crypto";
import { getCachedKey } from "../../Util/CachesKeyMap";
import { getGroupKeys } from "../../Services/chatsApi";
import { useSocket } from "../../Context/SocketContext";
import encryptGroupFile from "../../Util/encrypt/encryptGroupFile";
import AudioRecordingButton from "../buttons/AudioRecordingButton";
import ChooseFileButton from "../buttons/ChooseFileButton";

function uint8ArrayToBase64(arr) {
    return btoa(String.fromCharCode(...arr));
}

function SendGroupMessageForm({ id, receiver, content, setContent }) {
    const { socket } = useSocket()
    const groupKey = getCachedKey(id);

    const inputRef = useRef();

    const [chooseFile, setChooseFile] = useState(false);
    const [files, setFiles] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState("");

    const uploadMutation = useUploadMutation({ setFiles, setAudioUrl })

    const onContentChangeHandler = (e) => {
        setContent(e.target.value);
    }

    const fileInputHandler = async (e) => {
        const files = e.target.files;
        const formData = new FormData();
        let defaultContent

        for (let file of files) {
            const { encryptedBlob, iv } = await encryptGroupFile(id, file, groupKey);
            // Append encrypted data
            formData.append("files", encryptedBlob);
            formData.append("ivs", iv);
            formData.append("types", file.type);
            formData.append("names", file.name);

            if (file.type.startsWith("image/")) {
                defaultContent = content.length === 0 ? (files.length > 1 ? "Images" : "Image") : content;
            } else if (file.type.startsWith("video/")) {
                defaultContent = content.length === 0 ? (files.length > 1 ? "Videos" : "Video") : content;
            } else {
                defaultContent = content.length === 0 ? (files.length > 1 ? "Files" : "File") : content;
            }
        }

        const { ciphertext, iv } = await encryptGroupMessage(groupKey, defaultContent);

        formData.append("content", uint8ArrayToBase64(new Uint8Array(ciphertext)));
        formData.append("nonce", uint8ArrayToBase64(new Uint8Array(iv)));

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
                setChooseFile(false);
            } else if (file.type.startsWith("video/")) {
                const video = document.createElement("video");
                video.src = url;
                video.controls = true;
                video.classList.add("preview-container");
                preview.appendChild(video);
                setChooseFile(false);
            }
            else {
                const div = document.createElement("div");
                div.innerHTML = `📄 ${file.name}`;
                div.classList.add("preview-files-container");
                preview.appendChild(div);
                setChooseFile(false);

            }
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        if (!content && !files) return

        if (files) {
            uploadMutation.mutate({
                id,
                files
            })
        } else {
            const { ciphertext, iv } = await encryptGroupMessage(groupKey, content);

            const data = {
                chatId: id,
                content: uint8ArrayToBase64(new Uint8Array(ciphertext)),
                nonce: uint8ArrayToBase64(new Uint8Array(iv)),
            }
            socket.emit("sendMessage", data)
        }


        setContent("")
        document.getElementById("preview").innerHTML = "";
        inputRef.current?.focus();
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            onSubmitHandler(e)
        }
    };


    return (
        <form className="sendMessageForm" onSubmit={onSubmitHandler}>
            {/* previews  */}
            <div id="preview" />
            <div id="preview-file" />
            {audioUrl && <audio controls src={audioUrl} />}

            {/* sending logic  */}
            <div className="sendMessageForm-main" >
                <div className="sendMessageForm-inputs">
                    {!isRecording && <ChooseFileButton fileInputHandler={fileInputHandler} chooseFile={chooseFile} setChooseFile={setChooseFile} />}
                    {!isRecording && <textarea ref={inputRef} type="text" className="sendMessageForm-input" rows={1} value={content} onClick={() => setChooseFile(false)} onKeyDown={handleKeyDown} onChange={onContentChangeHandler} placeholder="Type here..." />}
                    <AudioRecordingButton public_key={groupKey} setFiles={setFiles} isRecording={isRecording} setAudioUrl={setAudioUrl} setIsRecording={setIsRecording} setChooseFile={setChooseFile} isGroup={true} groupId={id} />
                </div>

                <button type="submit" className="sendMessageForm-send-button" disabled={uploadMutation.isPending || isRecording} >
                    {!uploadMutation.isPending && <FaPaperPlane color="#fff" />}
                    {uploadMutation.isPending && <div className="loader"></div>}
                </button>
            </div>

        </form>
    )

}

export default SendGroupMessageForm