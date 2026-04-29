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

    const inputRef = useRef();

    const [chooseFile, setChooseFile] = useState(false);
    const [files, setFiles] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState("");

    // const [startRecord, setStartRecord] = useState(false);

    const uploadMutation = useUploadMutation({ setFiles, setAudioUrl })

    const onContentChangeHandler = (e) => {
        setContent(e.target.value);
    }

    const fileInputHandler = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        // Check current file count in preview
        const previewDoc = document.getElementById("preview");
        const currentFileCount = previewDoc.children.length;
        const newFileCount = files.length;
        const totalFileCount = currentFileCount + newFileCount;

        // Limit to 5 files
        if (totalFileCount > 5) {
            alert(`You can select a maximum of 5 files. You currently have ${currentFileCount} file(s) selected.`);
            return;
        }

        const formData = new FormData();
        const receiverKey = receiver?.public_key;

        // 1. Encrypt ALL files first (parallel + awaited)
        const encryptedResults = await Promise.all(
            files.map((file) =>
                encryptFile(file, receiverKey)
            )
        );

        // 2. Append files + metadata in SAME order
        encryptedResults.forEach((res, i) => {
            const file = files[i];

            formData.append("files", res.encryptedBlob, file.name);

            formData.append(
                "meta",
                JSON.stringify({
                    key: res.encryptedKey,
                    nonce: res.nonce,
                    iv: res.iv,
                    type: file.type,
                    name: file.name,
                })
            );
        });

        // 3. Compute default content ONCE
        let defaultContent = content;

        if (!content || content.length === 0) {
            const type = files[0].type;

            if (type.startsWith("image/")) {
                defaultContent = files.length > 1 ? "Images" : "Image";
            } else if (type.startsWith("video/")) {
                defaultContent = files.length > 1 ? "Videos" : "Video";
            } else {
                defaultContent = files.length > 1 ? "Files" : "File";
            }
        }

        // 4. Encrypt message
        const encryptedData = encryptMessage(
            defaultContent,
            localStorage.getItem("privateKey"),
            receiverKey
        );

        formData.append("content", encryptedData.encrypted);
        formData.append("nonce", encryptedData.nonce);

        // 5. Set AFTER everything is ready
        setFiles(formData);

        // 6. Preview (safe, sync)
        const preview = document.getElementById("preview");

        files.forEach((file) => {
            const url = URL.createObjectURL(file);

            if (file.type.startsWith("image/")) {
                const img = document.createElement("img");
                img.src = url;
                img.classList.add("preview-container");
                preview.appendChild(img);
            } else if (file.type.startsWith("video/")) {
                const video = document.createElement("video");
                video.src = url;
                video.controls = true;
                video.classList.add("preview-container");
                preview.appendChild(video);
            } else {
                const div = document.createElement("div");
                div.innerHTML = `📄 ${file.name}`;
                div.classList.add("preview-files-container");
                preview.appendChild(div);
            }
        });

        setChooseFile(false);
    };

    const onSubmitHandler = (e) => {
        e.preventDefault();
        setChooseFile(false)

        if (!content && !files) return

        if (files) {
            uploadMutation.mutate({
                id,
                files
            });
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
        inputRef.current?.focus();
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            onSubmitHandler(e)
        }
    };

    return (
        <form className="sendMessageForm" onSubmit={onSubmitHandler}>
            <div className="sendMessageForm-main" >
                <div className="sendMessageForm-main-container">
                    <div className="previews-container">
                        <div id="preview" />
                        <div id="preview-file" />
                        {audioUrl && <audio controls src={audioUrl} />}
                    </div>
                    <div className="sendMessageForm-inputs">
                        {!isRecording && <ChooseFileButton fileInputHandler={fileInputHandler} chooseFile={chooseFile} setChooseFile={setChooseFile} />}
                        {!isRecording && <textarea ref={inputRef} type="text" className="sendMessageForm-input" rows={1} value={content} onClick={() => setChooseFile(false)} onKeyDown={handleKeyDown} onChange={onContentChangeHandler} placeholder="Type here..." />}
                        <AudioRecordingButton public_key={receiver?.public_key} setFiles={setFiles} isRecording={isRecording} setAudioUrl={setAudioUrl} setIsRecording={setIsRecording} setChooseFile={setChooseFile} />
                    </div>
                </div>

                <button type="submit" className="sendMessageForm-send-button" disabled={uploadMutation.isPending || isRecording} >
                    {!uploadMutation.isPending && <FaPaperPlane color="#fff" />}
                    {uploadMutation.isPending && <div className="loader"></div>}
                </button>
            </div>
        </form>
    );
}

export default SendMessageForm