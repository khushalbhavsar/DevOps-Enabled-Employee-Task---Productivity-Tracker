const Task = require('../models/Task');
const User = require('../models/User');
const logger = require('../utils/logger');
const { Counter } = require('prom-client');

// Prometheus counter for task operations
const taskCounter = new Counter({
    name: 'tasks_total',
    help: 'Total number of tasks created',
    labelNames: ['status', 'priority']
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin)
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, assignedTo, dueDate, priority, estimatedHours, tags } = req.body;

        const task = await Task.create({
            title,
            description,
            assignedTo,
            assignedBy: req.user.id,
            dueDate,
            priority,
            estimatedHours,
            tags
        });

        taskCounter.inc({ status: task.status, priority: task.priority });

        logger.info(`Task created: ${task.title} by ${req.user.email}`);

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
    try {
        const { status, priority, assignedTo } = req.query;

        let query = {};

        // Non-admin users can only see their own tasks
        if (req.user.role !== 'admin') {
            query.assignedTo = req.user.id;
        } else if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        if (status) query.status = status;
        if (priority) query.priority = priority;

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email department')
            .populate('assignedBy', 'name email');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check authorization
        if (req.user.role !== 'admin' && task.assignedTo._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this task' });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Authorization check
        if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }

        // If task is being marked as completed
        if (req.body.status === 'completed' && task.status !== 'completed') {
            req.body.completedAt = Date.now();

            // Update user's task completion count
            await User.findByIdAndUpdate(task.assignedTo, {
                $inc: { tasksCompleted: 1 }
            });
        }

        task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        logger.info(`Task updated: ${task.title}`);

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.deleteOne();

        logger.info(`Task deleted: ${task.title}`);

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.comments.push({
            user: req.user.id,
            text: req.body.text
        });

        await task.save();

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};
