import React, { useEffect, useRef, useState } from 'react'
import { FaMicrophone, FaPause } from 'react-icons/fa6';
import encryptFile from '../../Util/encrypt/encryptFile';
import encryptGroupFile from '../../Util/encrypt/encryptGroupFile';
import { encryptMessage } from '../../Hooks/useEncryptMessage';
import { encryptGroupMessage } from '../../Util/crypto';

function uint8ArrayToBase64(arr) {
    return btoa(String.fromCharCode(...arr));
}

function AudioRecordingButton({ public_key, setFiles, isRecording, setAudioUrl, setIsRecording, setChooseFile, isGroup = false, groupId }) {
    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const [seconds, setSeconds] = useState(0);
    const [audioFile, setAudioFile] = useState(null);

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

    const startRecording = async () => {
        try {
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

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const file = new File([blob], `recording-${Date.now()}.webm`, {
                    type: "audio/webm",
                });

                setAudioFile(file);
                setAudioUrl(URL.createObjectURL(blob));

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                }

                const formData = new FormData();
                let defaultContent = "Audio Message";

                if (isGroup) {
                    const { encryptedBlob, iv } = await encryptGroupFile(groupId, file, public_key);

                    formData.append("files", encryptedBlob);
                    formData.append("ivs", iv);
                    formData.append("types", file.type);
                    formData.append("names", file.name);

                    const encryptedData = await encryptGroupMessage(public_key, defaultContent);

                    formData.append("content", uint8ArrayToBase64(new Uint8Array(encryptedData.ciphertext)));
                    formData.append("nonce", uint8ArrayToBase64(new Uint8Array(encryptedData.iv)));
                } else {
                    const { encryptedBlob, encryptedKey, nonce, iv } = await encryptFile(file, public_key);

                    formData.append("files", encryptedBlob);
                    formData.append("keys", encryptedKey);
                    formData.append("nonces", nonce);
                    formData.append("ivs", iv);
                    formData.append("types", file.type);
                    formData.append("names", file.name);

                    const encryptedData = encryptMessage(defaultContent, localStorage.getItem("privateKey"), public_key);
                    formData.append("content", encryptedData.encrypted);
                    formData.append("nonce", encryptedData.nonce);
                }
                setFiles(formData);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access error:", error);
        }
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current) return;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    };
    return (
        <>
            {!isRecording && <button className="sendMessageForm-audio-button" onClick={() => { startRecording(); setChooseFile(false); }}><FaMicrophone /></button>}
            {isRecording &&
                <div className="sendMessageForm-recording-inputs">
                    <div>Recording: {seconds}s</div>
                    <button className="sendMessageForm-audio-button" onClick={stopRecording} disabled={!isRecording}><FaPause /></button>
                </div>
            }
        </>

    )
}

export default AudioRecordingButton