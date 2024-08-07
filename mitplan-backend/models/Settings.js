const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  timelineLength: { type: Number, required: true, default: 121 },
  columnCount: { type: Number, required: true, default: 2 },
});

const Settings = mongoose.model('Settings', SettingsSchema);

module.exports = Settings;