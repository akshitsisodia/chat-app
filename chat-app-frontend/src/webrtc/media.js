// webrtc/media.js
export async function getMediaStream({ video }) {
  return navigator.mediaDevices.getUserMedia({
    video,
    audio: true,
  });
}