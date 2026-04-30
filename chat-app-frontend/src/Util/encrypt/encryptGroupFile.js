const encryptGroupFile = async (file, cryptoKey) => {
  if (!cryptoKey) {
    throw new Error("Missing group key");
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const buffer = await file.arrayBuffer();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    buffer,
  );

  return {
    encryptedBlob: new Blob([encryptedBuffer]),
    iv: btoa(String.fromCharCode(...iv)),
  };
};

export default encryptGroupFile;