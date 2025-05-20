const express = require('express');
const router = express.Router();
const { 
    createWorkspace,
    getWorkspaces,
    updateWorkspace,
    deleteWorkspace,
    setDefaultWorkspace,
    addSectionToWorkspace
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');

// All routes need authentication
router.use(protect);

// CRUD operations
router.post('/', createWorkspace);
router.get('/user/:userId', getWorkspaces);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);

// Special operations
router.post('/:id/default', setDefaultWorkspace);
router.post('/:workspaceId/sections/:sectionId', addSectionToWorkspace);

module.exports = router;
