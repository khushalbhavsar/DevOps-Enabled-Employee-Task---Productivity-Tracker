import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar,
    LinearProgress,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddTaskIcon from '@mui/icons-material/AddTask';
import PersonIcon from '@mui/icons-material/Person';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [openTaskDialog, setOpenTaskDialog] = useState(false);
    const [taskFormData, setTaskFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        priority: 'medium',
        estimatedHours: '',
        tags: '',
    });

    const { data: dashboardData, isLoading } = useQuery('dashboard', async () => {
        if (user.role === 'admin') {
            const response = await api.get('/analytics/dashboard');
            return response.data.data;
        } else {
            const response = await api.get(`/analytics/employee/${user.id}`);
            return response.data.data;
        }
    });

    // Fetch all users for task assignment
    const { data: usersData, isLoading: usersLoading } = useQuery('users', async () => {
        const response = await api.get('/users');
        return response.data.data;
    }, {
        enabled: user?.role === 'admin' && openTaskDialog,
        onError: (error) => {
            console.error('Error fetching users:', error);
            if (error.response?.status === 403) {
                toast.error('You are not authorized to access this feature.');
            }
        },
    });

    // Fetch recent tasks
    const { data: recentTasks } = useQuery('recentTasks', async () => {
        const response = await api.get('/tasks?limit=5');
        return response.data.data;
    });

    // Create task mutation
    const createTaskMutation = useMutation(
        async (taskData) => {
            const response = await api.post('/tasks', {
                ...taskData,
                tags: taskData.tags ? taskData.tags.split(',').map(tag => tag.trim()) : [],
            });
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('dashboard');
                queryClient.invalidateQueries('recentTasks');
                toast.success('Task assigned successfully!');
                handleCloseTaskDialog();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to create task');
            },
        }
    );

    const handleOpenTaskDialog = () => {
        setOpenTaskDialog(true);
    };

    const handleCloseTaskDialog = () => {
        setOpenTaskDialog(false);
        setTaskFormData({
            title: '',
            description: '',
            assignedTo: '',
            dueDate: '',
            priority: 'medium',
            estimatedHours: '',
            tags: '',
        });
    };

    const handleTaskFormChange = (e) => {
        const { name, value } = e.target;
        setTaskFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateTask = () => {
        if (!taskFormData.title || !taskFormData.assignedTo) {
            toast.error('Title and assignee are required');
            return;
        }
        createTaskMutation.mutate(taskFormData);
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    const StatCard = ({ title, value, icon, color, gradient }) => (
        <Card
            elevation={4}
            sx={{
                background: gradient || `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
                borderLeft: `4px solid ${color}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                },
            }}
        >
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" component="div" fontWeight="bold" color={color}>
                            {value}
                        </Typography>
                    </Box>
                    <Avatar
                        sx={{
                            bgcolor: color,
                            width: 60,
                            height: 60,
                            boxShadow: 3,
                        }}
                    >
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'info';
            default:
                return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'in-progress':
                return 'primary';
            case 'pending':
                return 'warning';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            {/* Header Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 3,
                    p: 4,
                    mb: 4,
                    color: 'white',
                    boxShadow: 4,
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h3" fontWeight="bold" gutterBottom>
                            Welcome back, {user.name}! 👋
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>
                            {user.role === 'admin'
                                ? 'Manage your team and track productivity'
                                : 'Track your tasks and boost your productivity'}
                        </Typography>
                    </Box>
                    {user.role === 'admin' && (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddTaskIcon />}
                            onClick={handleOpenTaskDialog}
                            sx={{
                                bgcolor: 'white',
                                color: '#667eea',
                                fontWeight: 'bold',
                                px: 3,
                                py: 1.5,
                                '&:hover': {
                                    bgcolor: '#f0f0f0',
                                    transform: 'scale(1.05)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Assign New Task
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {user.role === 'admin' ? (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Tasks"
                                value={dashboardData?.totalTasks || 0}
                                icon={<AssignmentIcon sx={{ fontSize: 30 }} />}
                                color="#1976d2"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Completed"
                                value={dashboardData?.completedTasks || 0}
                                icon={<CheckCircleIcon sx={{ fontSize: 30 }} />}
                                color="#2e7d32"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Pending"
                                value={dashboardData?.pendingTasks || 0}
                                icon={<PendingIcon sx={{ fontSize: 30 }} />}
                                color="#ed6c02"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Completion Rate"
                                value={`${dashboardData?.completionRate || 0}%`}
                                icon={<TrendingUpIcon sx={{ fontSize: 30 }} />}
                                color="#9c27b0"
                            />
                        </Grid>
                    </>
                ) : (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="My Tasks"
                                value={dashboardData?.totalTasks || 0}
                                icon={<AssignmentIcon sx={{ fontSize: 30 }} />}
                                color="#1976d2"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Completed"
                                value={dashboardData?.completedTasks || 0}
                                icon={<CheckCircleIcon sx={{ fontSize: 30 }} />}
                                color="#2e7d32"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Pending"
                                value={dashboardData?.pendingTasks || 0}
                                icon={<PendingIcon sx={{ fontSize: 30 }} />}
                                color="#ed6c02"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Productivity Score"
                                value={`${dashboardData?.productivityScore || 0}%`}
                                icon={<TrendingUpIcon sx={{ fontSize: 30 }} />}
                                color="#9c27b0"
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            {/* Recent Tasks Section */}
            {recentTasks && recentTasks.length > 0 && (
                <Card elevation={3} sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                            📋 Recent Tasks
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell><strong>Task</strong></TableCell>
                                        <TableCell><strong>Assignee</strong></TableCell>
                                        <TableCell align="center"><strong>Priority</strong></TableCell>
                                        <TableCell align="center"><strong>Status</strong></TableCell>
                                        <TableCell><strong>Due Date</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentTasks.map((task) => (
                                        <TableRow
                                            key={task._id}
                                            sx={{
                                                '&:hover': { bgcolor: '#f9f9f9' },
                                                transition: 'background-color 0.2s ease',
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {task.title}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {task.description?.substring(0, 50)}...
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                                                        <PersonIcon fontSize="small" />
                                                    </Avatar>
                                                    <Typography variant="body2">
                                                        {task.assignedTo?.name || 'Unassigned'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={task.priority}
                                                    color={getPriorityColor(task.priority)}
                                                    size="small"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={task.status}
                                                    color={getStatusColor(task.status)}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {task.dueDate
                                                    ? new Date(task.dueDate).toLocaleDateString()
                                                    : 'No deadline'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Team Performance Section (Admin Only) */}
            {user.role === 'admin' && dashboardData?.tasksByPriority && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    📊 Tasks by Priority
                                </Typography>
                                {dashboardData.tasksByPriority.map((item, index) => (
                                    <Box key={index} sx={{ mb: 2 }}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="body2" color="textSecondary">
                                                {item._id.charAt(0).toUpperCase() + item._id.slice(1)}
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {item.count} tasks
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(item.count / dashboardData.totalTasks) * 100}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: '#e0e0e0',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor:
                                                        item._id === 'high'
                                                            ? '#f44336'
                                                            : item._id === 'medium'
                                                                ? '#ff9800'
                                                                : '#2196f3',
                                                },
                                            }}
                                        />
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    🎯 Completion Progress
                                </Typography>
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography variant="h2" fontWeight="bold" color="primary">
                                        {dashboardData.completionRate || 0}%
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                        Overall team completion rate
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={dashboardData.completionRate || 0}
                                        sx={{
                                            mt: 3,
                                            height: 12,
                                            borderRadius: 6,
                                            bgcolor: '#e0e0e0',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: '#4caf50',
                                            },
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Task Assignment Dialog */}
            <Dialog
                open={openTaskDialog}
                onClose={handleCloseTaskDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                    },
                }}
            >
                <DialogTitle sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 'bold' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <AddTaskIcon />
                        Assign New Task
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Task Title"
                                name="title"
                                value={taskFormData.title}
                                onChange={handleTaskFormChange}
                                required
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={taskFormData.description}
                                onChange={handleTaskFormChange}
                                multiline
                                rows={3}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Assign to Employee"
                                name="assignedTo"
                                value={taskFormData.assignedTo}
                                onChange={handleTaskFormChange}
                                required
                                disabled={usersLoading}
                                helperText={
                                    usersLoading
                                        ? 'Loading employees...'
                                        : usersData?.filter((u) => u.role === 'employee').length === 0
                                            ? 'No employees found'
                                            : ''
                                }
                            >
                                {usersLoading ? (
                                    <MenuItem value="">Loading...</MenuItem>
                                ) : usersData && usersData.length > 0 ? (
                                    usersData
                                        .filter((u) => u.role === 'employee')
                                        .map((employee) => (
                                            <MenuItem key={employee._id} value={employee._id}>
                                                {employee.name} ({employee.email})
                                            </MenuItem>
                                        ))
                                ) : (
                                    <MenuItem value="">No employees available</MenuItem>
                                )}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Priority"
                                name="priority"
                                value={taskFormData.priority}
                                onChange={handleTaskFormChange}
                            >
                                <MenuItem value="low">Low</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Due Date"
                                name="dueDate"
                                type="date"
                                value={taskFormData.dueDate}
                                onChange={handleTaskFormChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Estimated Hours"
                                name="estimatedHours"
                                type="number"
                                value={taskFormData.estimatedHours}
                                onChange={handleTaskFormChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Tags (comma separated)"
                                name="tags"
                                value={taskFormData.tags}
                                onChange={handleTaskFormChange}
                                placeholder="e.g., frontend, urgent, bug"
                                helperText="Separate tags with commas"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                    <Button onClick={handleCloseTaskDialog} variant="outlined" size="large">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateTask}
                        variant="contained"
                        size="large"
                        disabled={createTaskMutation.isLoading}
                        sx={{
                            bgcolor: '#667eea',
                            '&:hover': { bgcolor: '#5568d3' },
                            px: 4,
                        }}
                    >
                        {createTaskMutation.isLoading ? 'Assigning...' : 'Assign Task'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Dashboard;
