const express = require("express");
const router = express.Router();
const Opportunity = require("../models/Opportunity");
const auth = require("../middleware/auth");

// -------------------- GET all opportunities --------------------
router.get("/", auth(), async (req, res) => {
  try {
    const query = req.user.role === "rep" ? { ownerId: req.user.id } : {};
    const opportunities = await Opportunity.find(query);
    res.status(200).json(opportunities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------- CREATE opportunity (rep only) --------------------
router.post("/", auth(["rep"]), async (req, res) => {
  try {
    const { title, value, stage } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const opportunity = await Opportunity.create({
      title,
      value: value || 0,
      stage: stage || "Discovery",
      ownerId: req.user.id,
    });

    res.status(201).json(opportunity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------- UPDATE opportunity --------------------
router.put("/:id", auth(), async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity)
      return res.status(404).json({ message: "Opportunity not found" });

    // RBAC: rep can only update own opportunities
    if (req.user.role === "rep" && opportunity.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, value, stage } = req.body;
    if (title) opportunity.title = title;
    if (value !== undefined) opportunity.value = value;
    if (stage) opportunity.stage = stage;

    await opportunity.save();
    res.status(200).json(opportunity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------- DELETE opportunity --------------------
router.delete("/:id", auth(), async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity)
      return res.status(404).json({ message: "Opportunity not found" });

    // RBAC: rep can only delete own opportunities
    if (req.user.role === "rep" && opportunity.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await opportunity.remove();
    res.status(200).json({ message: "Opportunity deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


