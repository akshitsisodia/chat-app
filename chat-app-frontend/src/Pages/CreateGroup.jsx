import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createGroup } from "../Services/chatsApi";
import Layout from "../Components/layout/Layout";
import SelectUsersModel from "../Components/model/SelectUsersModel";
import "../Styles/Form.css"
import UsersList from "../Components/common/UsersList";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaCheck, FaPlus, FaUserGroup } from "react-icons/fa6";



function CreateGroup() {
    const [name, setName] = useState("");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const previewUrlRef = useRef("");
    const [open, setOpen] = useState(false);
    const [members, setMembers] = useState([])
    const navigate = useNavigate()
    const memberIds = members?.map(curr => { return curr.id });

    const handlePhotoChange = (e) => {
        const selectedFile = e.target.files[0] || null;

        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
        }

        setFile(selectedFile);

        if (!selectedFile) {
            previewUrlRef.current = "";
            setPreview("");
            return;
        }

        const url = URL.createObjectURL(selectedFile);
        previewUrlRef.current = url;
        setPreview(url);
    };

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);


    const createGroupMutation = useMutation({
        mutationFn: createGroup,
        onSuccess: () => {
            navigate("/my-groups")
        },
        onError: ({ error }) => {
            console.log(error)
        }
    })

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name) return alert("Group name required");
        const formData = new FormData();
        formData.append("name", name);
        if (file) formData.append("photo", file);
        formData.append("members", JSON.stringify(memberIds));

        createGroupMutation.mutate(formData)

    };

    return (
        <Layout>
            {open && <SelectUsersModel onClose={() => setOpen(false)} setMembers={setMembers} memberIds={memberIds} />}

            <div className="form-wrapper create-group-page">
                <form className="group-form create-group-form" onSubmit={handleSubmit}>
                    <div className="create-group-header">
                        <span className="create-group-icon">
                            <FaUserGroup />
                        </span>
                        <div>
                            <h2>Create group</h2>
                            <p>Set a name, add a photo, and choose the people who belong here.</p>
                        </div>
                    </div>

                    <div className="create-group-body">
                        <label className="group-photo-field">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                            />
                            <span className="group-photo-preview">
                                {preview ? (
                                    <img src={preview} alt="Selected group" />
                                ) : (
                                    <FaCamera />
                                )}
                            </span>
                            <span className="group-photo-text">
                                <strong>{file ? "Change photo" : "Upload photo"}</strong>
                                <small>{file?.name || "PNG, JPG, or WEBP"}</small>
                            </span>
                        </label>

                        <label className="create-group-field">
                            <span>Group name</span>
                            <input
                                type="text"
                                placeholder="Enter group name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </label>

                        <div className="create-group-members-head">
                            <div>
                                <span>Members</span>
                                <p>{members.length > 0 ? `${members.length} selected` : "No members selected yet"}</p>
                            </div>
                            <button type='button' className="add-members-button" onClick={() => setOpen(true)}>
                                <FaPlus />
                                <span>Add</span>
                            </button>
                        </div>

                        <div className={`members-container ${members.length === 0 ? "members-container-empty" : ""}`}>
                            {members.length > 0 ? (
                                <UsersList data={members} select={"selected"} />
                            ) : (
                                <div className="create-group-empty-members">
                                    <FaUserGroup />
                                    <p>Choose members to start the conversation together.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="create-group-button" disabled={createGroupMutation.isPending}>
                        {createGroupMutation.isPending ? <p className="loader" /> : <><FaCheck /> <span>Create group</span></>}
                    </button>
                </form>
            </div>
        </Layout>
    );
}

export default CreateGroup;
