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
    assignTask,
    togglePublicView // Added new controller function
} = require('../controllers/sectionControler');

const router = express.Router();

// Public route for accessing shared sections (no auth required)
router.get('/shared/:token', getSharedSection);

// Protect all other routes
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

// Route to toggle public view status of a section
router.put('/:sectionId/toggle-public-view', togglePublicView);


module.exports = router;