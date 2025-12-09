const express = require('express');
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/')
    .get(protect, authorize('admin'), getUsers);

router.route('/:id')
    .get(protect, getUser)
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
