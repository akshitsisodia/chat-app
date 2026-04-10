function sanitizeReceiver(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    photo: user.photo,
    public_key: user.public_key,
  };
}

module.exports = sanitizeReceiver;
