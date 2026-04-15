const nacl = require("tweetnacl");
const util = require("tweetnacl-util");

exports.encryptWithPublicKey = (rawKey, publicKeyBase64) => {
  const receiverPublicKey = util.decodeBase64(publicKeyBase64);

  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const encrypted = nacl.box(
    rawKey,
    nonce,
    receiverPublicKey,
    ephemeral.secretKey,
  );

  return {
    encryptedKey: util.encodeBase64(encrypted),
    nonce: util.encodeBase64(nonce),
    ephemeralPublicKey: util.encodeBase64(ephemeral.publicKey),
  };
};
