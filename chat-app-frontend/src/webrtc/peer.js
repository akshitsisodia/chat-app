// webrtc/peer.js
function createPeerConnection({ onTrack, onIce }) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.ontrack = onTrack;
  pc.onicecandidate = (e) => {
    if (e.candidate) onIce(e.candidate);
  };

  return pc;
}

export default createPeerConnection;
