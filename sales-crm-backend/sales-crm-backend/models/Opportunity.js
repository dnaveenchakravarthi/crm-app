const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  value: { type: Number, required: true },
  stage: { type: String, enum: ["Discovery", "Proposal", "Won", "Lost"], default: "Discovery" },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
});

module.exports = mongoose.model("Opportunity", opportunitySchema);


