const mongoose = require('mongoose');

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value) && String(value).length === 24;
}

module.exports = {
  isValidObjectId,
};