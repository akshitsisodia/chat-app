import React, { useEffect, useRef, useState } from 'react'
import { FaMicrophone, FaPause } from 'react-icons/fa6';
import encryptFile from '../../Util/encrypt/encryptFile';

function AudioRecordingButton({ receiver, setFiles, isRecording, setAudioUrl, setIsRecording, setChooseFile }) {
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

                const { encryptedBlob, encryptedKey, nonce, iv } =
                    await encryptFile(file, receiver?.public_key);

                formData.append("files", encryptedBlob);
                formData.append("keys", encryptedKey);
                formData.append("nonces", nonce);
                formData.append("ivs", iv);
                formData.append("types", file.type);
                formData.append("names", file.name);

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
            {!isRecording && <button className="sendMessageForm-audio-button" onClick={() => { startRecording(); setChooseFile(false); }}><FaMicrophone color="#333" /></button>}
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