async function deriveKey(password, salt) {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" }, //PBKDF2 → Password Based Key Derivation Fuction 2 (turns a password into a strong key)
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptPrivateKey(privateKey, password) {
  const enc = new TextEncoder();

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(privateKey),
  );

  return {
    encryptedPrivateKey: btoa(
      String.fromCharCode(...new Uint8Array(encrypted)),
    ),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptPrivateKey(
  encryptedPrivateKey,
  password,
  salt,
  iv,
) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const key = await deriveKey(
    password,
    Uint8Array.from(atob(salt), (c) => c.charCodeAt(0)),
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Uint8Array.from(atob(iv), (c) => c.charCodeAt(0)) },
    key,
    Uint8Array.from(atob(encryptedPrivateKey), (c) => c.charCodeAt(0)),
  );

  return dec.decode(decrypted);
}
