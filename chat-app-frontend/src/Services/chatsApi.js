import API from "../Lib/api";

export const getOrCreateChat = async ({ id }) => {
  const res = await API.get(`chats/get-or-create/${id}`);
  return res.data;
};
export const getPrevChats = async () => {
  const res = await API.get("chats/prev-chats");
  return res.data;
};
export const createGroup = async (file) => {
  const res = await API.post("chats/create-group", file);
  return res.data;
};
export const getMyGroups = async () => {
  const res = await API.get("chats/my-groups");
  return res.data;
};
export const getGroupKeys = async ({ id }) => {
  const res = await API.get(`chats/group-keys/${id}`);
  return res.data;
};
export const getGroupMembers = async ({ id }) => {
  const res = await API.get(`chats/${id}`);
  return res.data;
};
export const leaveGroup = async (chatId) => {
  const res = await API.patch(`chats/leave-group/${chatId}`);
  return res.data;
};
