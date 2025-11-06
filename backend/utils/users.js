// utils/users.js

const users = {};

function addUser(socketId, username) {
  users[socketId] = username;
}

function removeUser(socketId) {
  delete users[socketId];
}

function getUserList() {
  return Object.values(users);
}

module.exports = { addUser, removeUser, getUserList };
