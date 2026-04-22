import nacl from "tweetnacl";
import * as util from "tweetnacl-util";

const encryptFile = async (file, receiverPublicKey) => {
  // Generate random AES key
  const aesKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt file (AES)
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    aesKey,
    "AES-GCM", //AES-GCM → Advanced Encryption Standard – Galois/Counter Mode (uses a key to protect data)
    false,
    ["encrypt"],
  );

  //convert into raw bytes
  const buffer = await file.arrayBuffer();

  // encryption on those bytes
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    buffer,
  );

  // Convert to blob for file like formate
  const encryptedBlob = new Blob([encryptedBuffer]);

  // Encrypt AES key (NaCl)
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const senderPrivateKey = localStorage.getItem("privateKey");
  if (!senderPrivateKey) {
    alert("Missing keys for encryption. Please login again.");
    logout();
    return;
  }

  const encryptedKey = nacl.box(
    aesKey,
    nonce,
    util.decodeBase64(receiverPublicKey),
    util.decodeBase64(senderPrivateKey),
  );

  return {
    encryptedBlob,
    encryptedKey: util.encodeBase64(encryptedKey),
    nonce: util.encodeBase64(nonce),
    iv: btoa(String.fromCharCode(...iv)),
  };
};

export default encryptFile;
