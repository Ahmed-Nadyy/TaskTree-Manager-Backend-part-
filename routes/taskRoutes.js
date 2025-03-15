const express = require("express");
const router = express.Router();
const sectionController = require("../controllers/sectionControler");

router.post("/:id", sectionController.addTask);
router.put("/:sectionId/:taskId", sectionController.updateTask);
router.delete("/:sectionId/:taskId", sectionController.deleteTask);
router.put("/:sectionId/:taskId/done", sectionController.markTaskAsDone);

module.exports = router;