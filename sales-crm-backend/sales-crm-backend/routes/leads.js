const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const Opportunity = require("../models/Opportunity");
const auth = require("../middleware/auth");

// -------------------- GET all leads --------------------
router.get("/", auth(), async (req, res) => {
  try {
    const query = req.user.role === "rep" ? { ownerId: req.user.id } : {};
    const leads = await Lead.find(query);
    res.status(200).json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------- CREATE lead (rep only) --------------------
 router.post("/", auth(["rep"]), async (req, res) => {
  try {
    const lead = await Lead.create({ ...req.body, ownerId: req.user.id });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------- UPDATE lead --------------------
router.put("/:id", auth(), async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // RBAC: rep can only update own leads
    if (req.user.role === "rep" && lead.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, email, phone, status } = req.body;
    if (name) lead.name = name;
    if (email) lead.email = email;
    if (phone) lead.phone = phone;
    if (status) lead.status = status;

    await lead.save();
    res.status(200).json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------- DELETE lead --------------------
router.delete("/:id", auth(), async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // RBAC: rep can only delete own leads
    if (req.user.role === "rep" && lead.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await lead.remove();
    res.status(200).json({ message: "Lead deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------- CONVERT lead → opportunity --------------------
router.post("/:id/convert", auth(), async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // RBAC: rep can only convert own leads
    if (req.user.role === "rep" && lead.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update lead status
    lead.status = "Qualified";
    await lead.save();

    // Create opportunity
    const { value, stage } = req.body;
    const opportunity = await Opportunity.create({
      title: `${lead.name} - Opportunity`,
      value: value || 0,
      stage: stage || "Discovery",
      ownerId: lead.ownerId,
      leadId: lead._id,
    });

    res.status(201).json({ message: "Lead converted to opportunity", opportunity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

