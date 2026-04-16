import nacl from "tweetnacl";
import * as util from "tweetnacl-util";

import "../../Styles/Form.css"
import { useEffect, useRef, useState } from "react";
import { FaArrowRight, FaImage, FaMicrophone, FaPaperclip, FaPause, FaPlus, FaVideo } from "react-icons/fa";
import { useUploadMutation } from "../../Hooks/useMutation";
import { getSocket } from "../../Lib/socket";
import { encryptGroupMessage } from "../../Util/crypto";
import { getCachedKey } from "../../Util/CachesKeyMap";
import { getGroupKeys } from "../../Services/chatsApi";

function uint8ArrayToBase64(arr) {
    return btoa(String.fromCharCode(...arr));
}

function SendGroupMessageForm({ id, receiver, content, setContent }) {

    const socket = getSocket()
    const [openFiles, setOpenFiles] = useState(false);
    const [files, setFiles] = useState(null);
    const [startRecord, setStartRecord] = useState(false);

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);

    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState("");
    const [audioFile, setAudioFile] = useState(null);
    const [seconds, setSeconds] = useState(0);



    const uploadMutation = useUploadMutation({ setFiles })

    //!recording Logic
    const startRecording = async () => {
        //startRecording, streamRef, mediaRecorderRef, chunksRef, setAudioFile, setAudioUrl, setIsRecording
        try {
            setStartRecord(true)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const file = new File([blob], `recording-${Date.now()}.webm`, {
                    type: "audio/webm",
                });

                setAudioFile(file);
                setAudioUrl(URL.createObjectURL(blob));

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access error:", error);
        }
    };

    const stopRecording = () => {
        // mediaRecorderRef, setIsRecording
        if (!mediaRecorderRef.current) return;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    };

    const sendRecording = async () => {
        // audioFile, isRecording, receiver
        if (!audioFile) return;
        if (isRecording) stopRecording();

        const formData = new FormData();
        const buffer = await audioFile.arrayBuffer();

        // AES key + IV
        const cryptoKey = await getCachedKey(id);
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            buffer
        );

        // Convert to blob
        const encryptedBlob = new Blob([encryptedBuffer]);

        formData.append("files", encryptedBlob);
        formData.append("ivs", btoa(String.fromCharCode(...iv)));
        formData.append("types", audioFile.type);
        formData.append("names", audioFile.name);

        uploadMutation.mutate({ id, files: formData });
        setAudioUrl("")
        setStartRecord(false)
    };

    //!recording Logic ends

    const onContentChangeHandler = (e) => {
        setContent(e.target.value);
    }

    const fileInputHandler = async (e) => {
        //  generate AES key + IV

        const cryptoKey = await getCachedKey(id); // from memory/cache


        const files = e.target.files;
        const formData = new FormData();


        for (let file of files) {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            //convert into raw bytes
            const buffer = await file.arrayBuffer();

            // encryption on those bytes
            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                cryptoKey,
                buffer
            );

            // Convert to blob for file like formate
            const encryptedBlob = new Blob([encryptedBuffer]);

            // Append encrypted data
            formData.append("files", encryptedBlob);
            formData.append("ivs", btoa(String.fromCharCode(...iv)));
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
                setOpenFiles(false)
            } else if (file.type.startsWith("video/")) {
                const video = document.createElement("video");
                video.src = url;
                video.controls = true;
                video.classList.add("preview-container");
                preview.appendChild(video);
                setOpenFiles(false)
            }
            else {
                const div = document.createElement("div");
                div.innerHTML = `📄 ${file.name}`;
                div.classList.add("preview-files-container");
                preview.appendChild(div);
                setOpenFiles(false)

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
            document.getElementById("preview").innerHTML = "";
            return
        }

        // content encryption before sending 
        const groupKey = getCachedKey(id);

        const { ciphertext, iv } = await encryptGroupMessage(groupKey, content);

        const data = {
            chatId: id,
            content: uint8ArrayToBase64(new Uint8Array(ciphertext)),
            nonce: uint8ArrayToBase64(new Uint8Array(iv)),
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

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
            setSeconds(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    return (
        <form className="sendMessageForm" onSubmit={onSubmitHandler}>
            {/* previews  */}
            <div id="preview">
            </div>
            <div id="preview-file">
            </div>
            {audioUrl && <audio controls src={audioUrl} />}

            {/* sending logic  */}
            <div className="sendMessageForm-main" >
                {!startRecord && <div className="sendMessageForm-inputs">
                    {openFiles && <div className="sendMessageForm-file-inputs">
                        {/* input 1 */}
                        <label htmlFor="file" className="sendMessageForm-file-input" onClick={() => document.getElementById('fileInput').click()}>
                            <FaPaperclip /> Document
                            <input type="file" multiple id="fileInput" onChange={fileInputHandler} />
                        </label>
                        <label htmlFor="file" className="sendMessageForm-file-input" onClick={() => document.getElementById('mediaInput').click()} >
                            <FaImage /> Photos
                            <input type="file" accept="image/*" multiple id="mediaInput" onChange={fileInputHandler} />
                        </label>
                        <label htmlFor="file" className="sendMessageForm-file-input" onClick={() => document.getElementById('videoInput').click()} >
                            <FaVideo /> Videos
                            <input type="file" accept="video/*" multiple id="videoInput" onChange={fileInputHandler} />
                        </label>

                    </div>}
                    <button type="button" className="sendMessageForm-files-button" onClick={() => setOpenFiles(prev => prev === false ? true : false)}><FaPlus color="#333" /></button>
                    <textarea type="text" className="sendMessageForm-input" rows={1} value={content} onClick={() => setOpenFiles(false)} onKeyDown={handleKeyDown} onChange={onContentChangeHandler} placeholder="Type here..." />
                    <button className="sendMessageForm-audio-button" onClick={() => { setStartRecord(true); startRecording(); setOpenFiles(false); }}><FaMicrophone color="#333" /></button>
                </div>}
                {!startRecord && <button type="submit" className="sendMessageForm-send-button" disabled={uploadMutation.isPending}>
                    {!uploadMutation.isPending && <FaArrowRight color="#fff" />}
                    {uploadMutation.isPending && <div className="loader"></div>}
                </button>}

                {/* Audio  recorder*/}
                {
                    startRecord &&
                    <>
                        <div className="sendMessageForm-recording-inputs">
                            <button className="sendMessageForm-audio-button" onClick={stopRecording} disabled={!isRecording}><FaPause /></button>
                            {isRecording && <div>Recording: {seconds}s</div>}
                        </div>
                        <button type="button" onClick={sendRecording} className="sendMessageForm-send-button" disabled={uploadMutation.isPending && !audioFile}>
                            {!uploadMutation.isPending && <FaArrowRight color="#fff" />}
                            {uploadMutation.isPending && <div className="loader"></div>}
                        </button>
                    </>
                }

            </div>

        </form>
    )

}

export default SendGroupMessageForm