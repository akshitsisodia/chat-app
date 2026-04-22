import React, { useState } from 'react'
import { FaImage, FaPaperclip, FaPlus, FaVideo } from 'react-icons/fa6';

function ChooseFileButton({ fileInputHandler, chooseFile, setChooseFile }) {

    return (
        <div className="choose-file-button">
            {chooseFile && <div className="sendMessageForm-file-inputs">
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
            <button type="button" className="sendMessageForm-files-button" onClick={() => setChooseFile(prev => prev === false ? true : false)}><FaPlus color="#333" /></button>
        </div>

    )
}

export default ChooseFileButton