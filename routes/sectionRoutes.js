const express = require("express");
const router = express.Router();
const sectionController = require("../controllers/sectionControler"); 

router.post("/", sectionController.addSection);
router.get("/:userId", sectionController.getSection);
router.put("/:id", sectionController.updateSection);
router.delete("/:id", sectionController.deleteSection);

module.exports = router;