import API from "../Lib/api";

export const getOrCreateChat = async ({ id }) => {
  const res = await API.get(`chats/get-or-create/${id}`);
  return res.data;
};
export const getPrevChats = async () => {
  const res = await API.get("chats/prev-chats");
  return res.data;
};
