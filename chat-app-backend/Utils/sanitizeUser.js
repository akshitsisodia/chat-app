function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    photo: user.photo,
  };
}

module.exports = sanitizeUser;
