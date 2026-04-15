import nacl from "tweetnacl";
import * as util from "tweetnacl-util";

export function decryptGroupKey(data, privateKeyBase64) {
  const decrypted = nacl.box.open(
    util.decodeBase64(data.encryptedKey),
    util.decodeBase64(data.nonce),
    util.decodeBase64(data.ephemeralPublicKey),
    util.decodeBase64(privateKeyBase64),
  );

  if (!decrypted) {
    throw new Error("Failed to decrypt group key");
  }

  return decrypted; // Uint8Array (32 bytes)
}

export async function importKey(rawKey) {
  return await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptGroupMessage(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encoded = new TextEncoder().encode(text);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );

  return {
    ciphertext: new Uint8Array(ciphertext),
    iv,
  };
}

export async function decryptGroupMessage(key, ciphertext, iv) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(ciphertext),
  );

  return new TextDecoder().decode(decrypted);
}
