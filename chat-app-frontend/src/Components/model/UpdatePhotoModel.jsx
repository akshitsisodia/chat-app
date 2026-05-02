import React, { useState } from 'react'
import Model from './Model'
import { updatePhoto } from '../../Services/userAPI';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MdPhotoCamera, MdClose } from 'react-icons/md'
import "../../Styles/UpdatePhotoModel.css"

function UpdatePhotoModel({ onClose }) {
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const queryClient = useQueryClient();

    const updatePhotoMutation = useMutation({
        mutationFn: updatePhoto,
        onSuccess: ({ data }) => {
            queryClient.setQueryData(["me"], (old) => {
                if (!old) return old
                return {
                    ...old,
                    data: { ...old.data, photo: data?.photo }

                }
            })
            onClose()
        },
        onError: (error) => {
            console.log(error)
            onClose()
        }
    });

    const onSubmitHandler = (e) => {
        e.preventDefault();
        if (!photo) return;
        if (!photo.type.startsWith("image/")) return;
        const formData = new FormData();
        formData.append("photo", photo)
        updatePhotoMutation.mutate(formData)
    }

    const handleRemovePhoto = () => {
        setPhoto(null);
        setPreview(null);
    }

    return (
        <Model onClose={onClose}>
            <div className="update-photo-model-container">
                <div className="update-photo-header">
                    <h2>Update Profile Photo</h2>
                    <p>Choose a new photo for your profile</p>
                </div>

                <div className="update-photo-preview-wrapper">
                    {preview ? (
                        <div className="update-photo-preview-box">
                            <img
                                src={preview}
                                alt="preview"
                                className="update-photo-preview-image"
                            />
                            <button
                                type="button"
                                className="update-photo-remove-btn"
                                onClick={handleRemovePhoto}
                                title="Remove photo"
                            >
                                <MdClose />
                            </button>
                        </div>
                    ) : (
                        <div className="update-photo-placeholder">
                            <MdPhotoCamera className="update-photo-icon" />
                            <p>No photo selected</p>
                        </div>
                    )}
                </div>

                <form onSubmit={onSubmitHandler} className="update-photo-form">
                    <label htmlFor="photo-input" className="update-photo-input-label">
                        <span className="update-photo-input-text">Choose Photo</span>
                        <input
                            id="photo-input"
                            type="file"
                            accept="image/*"
                            className="update-photo-input"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setPhoto(file);
                                    setPreview(URL.createObjectURL(file));
                                }
                            }}
                        />
                    </label>

                    <div className="update-photo-actions">
                        <button
                            type="submit"
                            className="update-photo-button"
                            disabled={updatePhotoMutation.isPending || !photo}
                        >
                            {updatePhotoMutation.isPending ? (
                                <span className="update-photo-loading">Uploading...</span>
                            ) : (
                                "Upload Photo"
                            )}
                        </button>
                        <button
                            type="button"
                            className="update-photo-cancel-button"
                            onClick={onClose}
                            disabled={updatePhotoMutation.isPending}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </Model>
    )
}

export default UpdatePhotoModel