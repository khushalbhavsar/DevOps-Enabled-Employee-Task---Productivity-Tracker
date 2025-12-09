const Task = require('../models/Task');
const User = require('../models/User');
const { Gauge } = require('prom-client');

// Prometheus gauges
const productivityGauge = new Gauge({
    name: 'employee_productivity_score',
    help: 'Productivity score of employees',
    labelNames: ['user_id', 'user_name']
});

// @desc    Get analytics dashboard
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
exports.getDashboard = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'employee' });
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'completed' });
        const pendingTasks = await Task.countDocuments({ status: 'pending' });
        const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });

        // Task completion rate
        const completionRate = totalTasks > 0
            ? ((completedTasks / totalTasks) * 100).toFixed(2)
            : 0;

        // Tasks by priority
        const tasksByPriority = await Task.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Overdue tasks
        const overdueTasks = await Task.countDocuments({
            status: { $ne: 'completed' },
            dueDate: { $lt: new Date() }
        });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalTasks,
                completedTasks,
                pendingTasks,
                inProgressTasks,
                overdueTasks,
                completionRate: parseFloat(completionRate),
                tasksByPriority
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get employee performance
// @route   GET /api/analytics/employee/:id
// @access  Private
exports.getEmployeePerformance = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Check authorization
        if (req.user.role !== 'admin' && req.user.id !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const totalTasks = await Task.countDocuments({ assignedTo: userId });
        const completedTasks = await Task.countDocuments({
            assignedTo: userId,
            status: 'completed'
        });
        const pendingTasks = await Task.countDocuments({
            assignedTo: userId,
            status: 'pending'
        });

        // Calculate productivity score
        const completionRate = totalTasks > 0
            ? (completedTasks / totalTasks) * 100
            : 0;

        // Tasks completed on time
        const onTimeTasks = await Task.countDocuments({
            assignedTo: userId,
            status: 'completed',
            $expr: { $lte: ['$completedAt', '$dueDate'] }
        });

        const onTimeRate = completedTasks > 0
            ? (onTimeTasks / completedTasks) * 100
            : 0;

        // Productivity score (weighted average)
        const productivityScore = (completionRate * 0.6 + onTimeRate * 0.4).toFixed(2);

        // Update user productivity score
        await User.findByIdAndUpdate(userId, {
            productivityScore: parseFloat(productivityScore)
        });

        // Update Prometheus gauge
        productivityGauge.set(
            { user_id: userId, user_name: user.name },
            parseFloat(productivityScore)
        );

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                },
                totalTasks,
                completedTasks,
                pendingTasks,
                completionRate: completionRate.toFixed(2),
                onTimeRate: onTimeRate.toFixed(2),
                productivityScore: parseFloat(productivityScore)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get team analytics
// @route   GET /api/analytics/team
// @access  Private (Admin)
exports.getTeamAnalytics = async (req, res, next) => {
    try {
        const employees = await User.find({ role: 'employee' }).select('name email productivityScore tasksCompleted');

        const teamProductivity = employees.reduce((acc, emp) => acc + emp.productivityScore, 0) / employees.length || 0;

        res.status(200).json({
            success: true,
            data: {
                employees,
                averageProductivity: teamProductivity.toFixed(2),
                totalEmployees: employees.length
            }
        });
    } catch (error) {
        next(error);
    }
};
