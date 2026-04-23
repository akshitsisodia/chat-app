import { getCachedKey } from "../CachesKeyMap";

const encryptGroupFile = async (groupId, file, groupPublicKey) => {
  const cryptoKey = await getCachedKey(groupId); // from memory/cache

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const buffer = await file.arrayBuffer();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    buffer,
  );

  // Convert to blob for file like formate
  const encryptedBlob = new Blob([encryptedBuffer]);

  return {
    encryptedBlob,
    iv: btoa(String.fromCharCode(...iv)),
  };
};

export default encryptGroupFile;
