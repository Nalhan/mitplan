const mongoose = require('mongoose');

const MitplanEventSchema = new mongoose.Schema({
  key: { type: Number, required: true, integer: true },
  name: { type: String, required: true },
  timestamp: { type: Number, required: true},
  columnId: { type: Number, required: true},
});

const MitplanEvent = mongoose.model('MitplanEvent', MitplanEventSchema);

module.exports = MitplanEvent;