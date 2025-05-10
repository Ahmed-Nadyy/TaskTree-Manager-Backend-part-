const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    addSection,
    getSection,
    updateSection,
    deleteSection,
    addTask,
    updateTask,
    deleteTask,
    markTaskAsDone,
    shareSection,
    getSharedSection,
    assignTask
} = require('../controllers/sectionControler');

const router = express.Router();

// Protect all routes except shared section access
router.use(protect);

// Standard section routes
router.post('/', addSection);
router.get('/:userId', getSection);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

// Task routes
router.post('/:sectionId/tasks', addTask);
router.put('/:sectionId/tasks/:taskId', updateTask);
router.delete('/:sectionId/tasks/:taskId', deleteTask);
router.put('/:sectionId/tasks/:taskId/done', markTaskAsDone);

// New sharing and assignment routes
router.post('/:sectionId/share', shareSection);
router.post('/:sectionId/tasks/:taskId/assign', assignTask);

// Public route for accessing shared sections (no auth required)
router.get('/shared/:token', getSharedSection);

module.exports = router;