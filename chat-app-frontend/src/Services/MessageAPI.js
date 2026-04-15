import API from "../Lib/api";

export const sendPrivateMessage = async ({ id, content }) => {
  const res = await API.post(`messages/${id}`, { content });
  return res.data;
};
export const getPrivateMessage = async ({ id, limit, offset }) => {
  const params = new URLSearchParams({
    limit,
    offset,
  });

  const res = await API.get(`messages/${id}`, { params });
  return res.data;
};
