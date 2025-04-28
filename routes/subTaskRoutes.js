const express = require("express");
const router = express.Router();
const sectionController = require("../controllers/sectionControler");
const { protect } = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(protect);

router.post("/:sectionId/:taskId", sectionController.addSubTask);
router.put("/:sectionId/:taskId/:subTaskId", sectionController.updateSubTask);
router.delete("/:sectionId/:taskId/:subTaskId", sectionController.deleteSubTask);
router.put("/:sectionId/:taskId/:subTaskId/done", sectionController.markSubTaskAsDone);

module.exports = router;