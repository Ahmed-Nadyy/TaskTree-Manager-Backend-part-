const express = require("express");
const router = express.Router();
const sectionController = require("../controllers/sectionControler"); 
const { protect } = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(protect);

router.post("/", sectionController.addSection);
router.get("/:userId", sectionController.getSection);
router.put("/:id", sectionController.updateSection);
router.delete("/:id", sectionController.deleteSection);

module.exports = router;