
export default function showNotification(message) {
  if (Notification.permission !== "granted") return;

  const notification = new Notification("New Message", {
    body: message.last_message,
  });
//   console.log(message);
//   notification.onclick = () => {
//     window.focus();
//     navigate(`/${message.chat_id}`);
//   };
}
