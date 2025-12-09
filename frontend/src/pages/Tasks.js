import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Tooltip,
} from '@mui/material';
import { format } from 'date-fns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddTaskIcon from '@mui/icons-material/AddTask';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
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

    const { data: tasksData, isLoading } = useQuery('tasks', async () => {
        const response = await api.get('/tasks');
        return response.data.data;
    });

    // Fetch all users for task assignment (admin only)
    const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery(
        'users',
        async () => {
            const response = await api.get('/users');
            return response.data.data;
        },
        {
            enabled: user?.role === 'admin' && openTaskDialog,
            onError: (error) => {
                console.error('Error fetching users:', error);
                if (error.response?.status === 403) {
                    toast.error('You are not authorized to access this feature.');
                } else {
                    toast.error('Failed to load users. Please refresh the page.');
                }
            },
        }
    );

    // Create task mutation (admin only)
    const createTaskMutation = useMutation(
        async (taskData) => {
            const response = await api.post('/tasks', {
                ...taskData,
                tags: taskData.tags ? taskData.tags.split(',').map((tag) => tag.trim()) : [],
            });
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('tasks');
                queryClient.invalidateQueries('dashboard');
                toast.success('Task assigned successfully!');
                handleCloseTaskDialog();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to create task');
            },
        }
    );

    // Update task status mutation (for completing tasks)
    const updateTaskMutation = useMutation(
        async ({ id, status }) => {
            const response = await api.put(`/tasks/${id}`, { status });
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('tasks');
                queryClient.invalidateQueries('dashboard');
                toast.success('Task status updated successfully!');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to update task');
            },
        }
    );

    // Delete task mutation (admin only)
    const deleteTaskMutation = useMutation(
        async (id) => {
            const response = await api.delete(`/tasks/${id}`);
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('tasks');
                queryClient.invalidateQueries('dashboard');
                toast.success('Task deleted successfully!');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to delete task');
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

    const handleCompleteTask = (taskId) => {
        updateTaskMutation.mutate({ id: taskId, status: 'completed' });
    };

    const handleDeleteTask = (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            deleteTaskMutation.mutate(taskId);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'in-progress':
                return 'info';
            case 'pending':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'error';
            case 'high':
                return 'warning';
            case 'medium':
                return 'info';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        {user?.role === 'admin' ? 'All Tasks' : 'My Tasks'}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                        {user?.role === 'admin'
                            ? 'Manage and assign tasks to your team'
                            : 'View and complete your assigned tasks'}
                    </Typography>
                </Box>
                {user?.role === 'admin' && (
                    <Button
                        variant="contained"
                        startIcon={<AddTaskIcon />}
                        onClick={handleOpenTaskDialog}
                        sx={{
                            bgcolor: '#667eea',
                            '&:hover': { bgcolor: '#5568d3' },
                            px: 3,
                            py: 1.5,
                            fontWeight: 'bold',
                        }}
                    >
                        Assign New Task
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell><strong>Title</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            {user?.role === 'admin' && <TableCell><strong>Assigned To</strong></TableCell>}
                            <TableCell align="center"><strong>Status</strong></TableCell>
                            <TableCell align="center"><strong>Priority</strong></TableCell>
                            <TableCell><strong>Due Date</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tasksData?.length > 0 ? (
                            tasksData.map((task) => (
                                <TableRow
                                    key={task._id}
                                    sx={{
                                        '&:hover': { bgcolor: '#f9f9f9' },
                                        opacity: task.status === 'completed' ? 0.7 : 1,
                                    }}
                                >
                                    <TableCell>
                                        <Typography
                                            variant="body1"
                                            fontWeight="medium"
                                            sx={{
                                                textDecoration:
                                                    task.status === 'completed' ? 'line-through' : 'none',
                                            }}
                                        >
                                            {task.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="textSecondary">
                                            {task.description?.substring(0, 50)}
                                            {task.description?.length > 50 ? '...' : ''}
                                        </Typography>
                                    </TableCell>
                                    {user?.role === 'admin' && (
                                        <TableCell>
                                            <Typography variant="body2">
                                                {task.assignedTo?.name || 'Unassigned'}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {task.assignedTo?.email}
                                            </Typography>
                                        </TableCell>
                                    )}
                                    <TableCell align="center">
                                        <Chip
                                            label={task.status}
                                            color={getStatusColor(task.status)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={task.priority}
                                            color={getPriorityColor(task.priority)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {task.dueDate
                                            ? format(new Date(task.dueDate), 'MMM dd, yyyy')
                                            : 'No deadline'}
                                    </TableCell>
                                    <TableCell align="center">
                                        {user?.role === 'employee' && task.status !== 'completed' && (
                                            <Tooltip title="Mark as Completed">
                                                <IconButton
                                                    color="success"
                                                    onClick={() => handleCompleteTask(task._id)}
                                                    disabled={updateTaskMutation.isLoading}
                                                    size="small"
                                                >
                                                    <CheckCircleIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {user?.role === 'admin' && (
                                            <>
                                                <Tooltip title="Delete Task">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleDeleteTask(task._id)}
                                                        disabled={deleteTaskMutation.isLoading}
                                                        size="small"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={user?.role === 'admin' ? 7 : 6} align="center">
                                    <Box py={4}>
                                        <Typography variant="h6" color="textSecondary" gutterBottom>
                                            No tasks found
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {user?.role === 'admin'
                                                ? 'Click "Assign New Task" to create your first task'
                                                : 'No tasks assigned to you yet'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Task Assignment Dialog (Admin Only) */}
            {user?.role === 'admin' && (
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
                                    <MenuItem value="urgent">Urgent</MenuItem>
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
            )}
        </Box>
    );
};

export default Tasks;
