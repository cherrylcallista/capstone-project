const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  hideEmail: { type: Boolean, default: false },
  language: { type: String, default: 'id' },
  theme: { type: String, default: 'light' },
}, { _id: false });

const profileSchema = new mongoose.Schema({
  id: Number,
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  profilePicture: { type: String, default: '' },
  passwordHash: { type: String, required: true },
  settings: { type: settingsSchema, default: () => ({}) },
}, { _id: false });

const taskSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  clientId: { type: String, default: undefined },
  detail: { type: String, required: true, trim: true },
  addedTime: { type: String, default: () => new Date().toISOString() },
  dueDate: { type: String, default: null },
  markedAsFinished: { type: Boolean, default: false },
  repeatTask: { type: Boolean, default: false },
  repeatEvery: { type: mongoose.Schema.Types.Mixed, default: null },
  category: { type: String, default: '' },
  matrix: { type: Number, default: undefined },
  isTodo: { type: Boolean, default: true },
}, { _id: false });

const savedIntervalSchema = new mongoose.Schema({
  activeTime: { type: Number, required: true },
  restTime: { type: Number, default: 0 },
  favorite: { type: Boolean, default: false },
}, { _id: false });

const scheduleBlockSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  clientId: { type: String, required: true },
  date: { type: String, required: true },
  hour: { type: Number, required: true, min: 0, max: 23.5 },
  durationHours: { type: Number, required: true, default: 1, min: 0.5, max: 24 },
  label: { type: String, required: true, trim: true, maxlength: 60 },
  color: { type: String, required: true, match: /^#[0-9A-Fa-f]{6}$/ },
  deleted: { type: Boolean, default: false },
}, { _id: false });

const accountSchema = new mongoose.Schema({
  account: { type: profileSchema, required: true },
  timer: {
    savedIntervals: { type: [savedIntervalSchema], default: [] },
  },
  tasks: { type: [taskSchema], default: [] },
  categories: { type: [String], default: [] },
  schedules: { type: [scheduleBlockSchema], default: [] },
}, {
  collection: 'accounts',
  timestamps: true,
});

accountSchema.index({ 'account.email': 1 }, { unique: true });

module.exports = mongoose.model('Account', accountSchema);
