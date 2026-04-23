export function createSignaling(socket) {
  return {
    callUser: (to, offer, type) =>
      socket.emit("call-user", { to, offer, type }),

    answerCall: (to, answer) => socket.emit("answer-call", { to, answer }),

    sendIce: (to, candidate) => socket.emit("ice-candidate", { to, candidate }),

    onIncoming: (cb) => socket.on("incoming-call", cb),

    onIce: (cb) => socket.on("ice-candidate", cb),
  };
}
