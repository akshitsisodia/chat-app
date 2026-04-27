/**
 * Invite Members Service
 * Handles all socket events and API calls related to inviting users to calls
 */

/**
 * Send an invite to a user to join an ongoing call
 * @param {Object} socket - Socket.io connection
 * @param {string} userId - ID of user to invite
 * @param {Object} callData - Call information
 * @param {string} callData.callId - Unique call identifier
 * @param {string} callData.invitedBy - ID of user sending invite
 * @param {string} callData.invitedByName - Name of user sending invite
 * @param {string} callData.invitedByPhoto - Photo of user sending invite
 * @param {string} callData.callType - Type of call ('audio' or 'video')
 * @param {Array} callData.currentParticipants - List of current participant IDs
 */
export const sendInvite = (socket, userId, callData) => {
  if (!socket) {
    console.error("Socket not connected");
    return;
  }

  socket.emit("invite-to-call", {
    to: userId,
    ...callData,
  });
};

/**
 * Accept an invite and join the call
 * @param {Object} socket - Socket.io connection
 * @param {string} invitedBy - ID of user who sent the invite
 * @param {string} callId - Call identifier
 */
export const acceptInvite = (socket, invitedBy, callId) => {
  if (!socket) {
    console.error("Socket not connected");
    return;
  }

  socket.emit("accept-invite", {
    from: invitedBy,
    callId,
  });
};

/**
 * Reject an invite
 * @param {Object} socket - Socket.io connection
 * @param {string} invitedBy - ID of user who sent the invite
 * @param {string} callId - Call identifier
 */
export const rejectInvite = (socket, invitedBy, callId) => {
  if (!socket) {
    console.error("Socket not connected");
    return;
  }

  socket.emit("reject-invite", {
    from: invitedBy,
    callId,
  });
};

/**
 * Notify call participants that a new user has joined via invite
 * @param {Object} socket - Socket.io connection
 * @param {Array} participants - List of participant IDs
 * @param {string} newUserId - ID of newly joined user
 * @param {string} newUserName - Name of newly joined user
 * @param {string} callId - Call identifier
 */
export const notifyNewParticipant = (
  socket,
  participants,
  newUserId,
  newUserName,
  callId,
) => {
  if (!socket) {
    console.error("Socket not connected");
    return;
  }

  participants.forEach((participantId) => {
    socket.emit("participant-joined", {
      to: participantId,
      newUserId,
      newUserName,
      callId,
    });
  });
};

/**
 * Cancel a pending invite
 * @param {Object} socket - Socket.io connection
 * @param {string} userId - ID of user to cancel invite for
 * @param {string} callId - Call identifier
 */
export const cancelInvite = (socket, userId, callId) => {
  if (!socket) {
    console.error("Socket not connected");
    return;
  }

  socket.emit("cancel-invite", {
    to: userId,
    callId,
  });
};
