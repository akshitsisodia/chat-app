import API from "../Lib/api";

export const getMe = async () => {
  const res = await API.get("users/me");
  return res.data;
};
export const getAllUsers = async ({ search, limit, page, signal }) => {
  const params = new URLSearchParams({
    limit,
    page,
    ...(search && { search: search }),
  });

  const res = await API.get("users", { params, signal });
  return res.data;
};

export const updatePhoto = async (file) => {
  const res = await API.post("users/update-photo", file);
  return res.data;
};

export const getUserById = async (id) => {
  const res = await API.get(`users/${id}`);
  return res.data;
};

export const getPrevChatUsers = async () => {
  const res = await API.get("users/previous-chats");
  return res.data;
};

export const setPublicKey = async (data) => {
  const res = await API.post("users/public-key", data);
  return res.data;
};
