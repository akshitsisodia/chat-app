import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createGroup } from "../Services/chatsApi";
import Layout from "../Components/layout/Layout";
import SelectUsersModel from "../Components/model/SelectUsersModel";
import "../Styles/Form.css"
import UsersList from "../Components/common/UsersList";
import { useNavigate } from "react-router-dom";



function CreateGroup() {
    const [name, setName] = useState("");
    const [file, setFile] = useState(null);
    const [open, setOpen] = useState(false);
    const [members, setMembers] = useState([])
    const navigate = useNavigate()
    const memberIds = members?.map(curr => { return curr.id });
    let groupKey;


    const createGroupMutation = useMutation({
        mutationFn: createGroup,
        onSuccess: ({ data }) => {
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

            <div className="form-wrapper">
                <form className="group-form" onSubmit={handleSubmit}>
                    <h2>Create Group</h2>
                    <input
                        type="text"
                        placeholder="Group name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files[0])}
                    />

                    <button type='button' onClick={() => setOpen(true)}>Add members</button>

                    <div className="members-container">
                        {members.length > 0 && <UsersList data={members} select={"selected"} />}
                    </div>


                    <button type="submit" className="create-group-button" disabled={createGroupMutation.isPending}>{createGroupMutation.isPending ? <p className="loader" /> : "Create"}</button>
                </form>
            </div>
        </Layout>
    );
}

export default CreateGroup;