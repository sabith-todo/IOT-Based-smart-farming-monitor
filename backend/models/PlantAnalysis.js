const mongoose = require('mongoose');

const plantAnalysisSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      default: 'Tea Leaf Health Scan',
      trim: true,
    },
    plantationBlock: {
      type: String,
      default: 'Block A - Camellia Sinensis (Upper Valley)',
      trim: true,
    },
    cultivar: {
      type: String,
      default: 'Camellia sinensis var. sinensis',
      trim: true,
    },
    specimenStage: {
      type: String,
      default: 'Flush (Two Leaves & a Bud)',
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    symptomsObserved: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    gps: {
      lat: { type: String, default: '11.0168' },
      lng: { type: String, default: '76.9558' },
    },
    status: {
      type: String,
      enum: ['Queued for Analysis', 'Under Expert Review', 'Verified Clean', 'Action Required'],
      default: 'Queued for Analysis',
    },
    aiInferenceState: {
      type: String,
      default: 'Pending Model Service Connection',
    },
    expertNotes: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: String,
      default: '',
    },
    time: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlantAnalysis', plantAnalysisSchema);
