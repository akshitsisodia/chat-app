export default async function showNotification(message) {
  if (typeof window === "undefined") return;

  if (!("Notification" in window)) return;

  let permission = Notification.permission;

  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return;
    }
  }

  if (permission !== "granted") return;

  try {
    const notification = new Notification("New Message", {
      body: message.last_message || "New message",
    });

    notification.onclick = () => {
      window.focus();
    };

  } catch (err) {
    console.error("Notification error:", err);
  }
}