const express = require('express');
const {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
    addComment
} = require('../controllers/task.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/')
    .get(protect, getTasks)
    .post(protect, authorize('admin'), createTask);

router.route('/:id')
    .get(protect, getTask)
    .put(protect, updateTask)
    .delete(protect, authorize('admin'), deleteTask);

router.post('/:id/comments', protect, addComment);

module.exports = router;
