const express = require("express");
const router = express.Router();
const sectionController = require("../controllers/sectionControler");
const { protect } = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/tasks/{id}:
 *   post:
 *     summary: Create a new task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               isImportant:
 *                 type: boolean
 *               dueDate:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post("/:id", sectionController.addTask);

/**
 * @swagger
 * /api/tasks/{sectionId}/{taskId}:
 *   put:
 *     summary: Update a task
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         description: Section ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: Task ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isDone:
 *                 type: boolean
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               isImportant:
 *                 type: boolean
 *               dueDate:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.put("/:sectionId/:taskId", sectionController.updateTask);

router.delete("/:sectionId/:taskId", sectionController.deleteTask);
router.put("/:sectionId/:taskId/done", sectionController.markTaskAsDone);

module.exports = router;