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
    CircularProgress,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { toast } from 'react-toastify';
import api from '../services/api';

const departments = [
    'Engineering',
    'Marketing',
    'Sales',
    'Human Resources',
    'Finance'
];

const positions = [
    'Junior',
    'Mid-Level',
    'Senior',
    'Lead',
    'Manager'
];

const Users = () => {
    const queryClient = useQueryClient();
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'employee',
        department: '',
        position: '',
        isActive: true,
    });

    // Fetch all users
    const { data: usersData, isLoading } = useQuery('users', async () => {
        const response = await api.get('/users');
        return response.data.data;
    });

    // Update user mutation
    const updateUserMutation = useMutation(
        async ({ id, data }) => {
            const response = await api.put(`/users/${id}`, data);
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
                toast.success('User updated successfully');
                handleCloseDialog();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to update user');
            },
        }
    );

    // Delete user mutation
    const deleteUserMutation = useMutation(
        async (id) => {
            const response = await api.delete(`/users/${id}`);
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
                toast.success('User deleted successfully');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to delete user');
            },
        }
    );

    const handleOpenDialog = (user = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department || '',
                position: user.position || '',
                isActive: user.isActive,
            });
        } else {
            setSelectedUser(null);
            setFormData({
                name: '',
                email: '',
                role: 'employee',
                department: '',
                position: '',
                isActive: true,
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedUser(null);
        setFormData({
            name: '',
            email: '',
            role: 'employee',
            department: '',
            position: '',
            isActive: true,
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.email) {
            toast.error('Name and email are required');
            return;
        }

        if (selectedUser) {
            updateUserMutation.mutate({ id: selectedUser._id, data: formData });
        }
    };

    const handleDelete = (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUserMutation.mutate(userId);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        User Management
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                        Manage employees and assign tasks
                    </Typography>
                </Box>
            </Box>

            {/* Users Summary */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                            {usersData?.length || 0}
                        </Typography>
                        <Typography color="textSecondary">Total Users</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                            {usersData?.filter((u) => u.isActive).length || 0}
                        </Typography>
                        <Typography color="textSecondary">Active Users</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                            {usersData?.filter((u) => u.role === 'admin').length || 0}
                        </Typography>
                        <Typography color="textSecondary">Admins</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary.main">
                            {usersData?.filter((u) => u.role === 'employee').length || 0}
                        </Typography>
                        <Typography color="textSecondary">Employees</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Users Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Role</strong></TableCell>
                            <TableCell><strong>Department</strong></TableCell>
                            <TableCell><strong>Position</strong></TableCell>
                            <TableCell align="center"><strong>Tasks Completed</strong></TableCell>
                            <TableCell align="center"><strong>Productivity</strong></TableCell>
                            <TableCell align="center"><strong>Status</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {usersData?.length > 0 ? (
                            usersData.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.role}
                                            color={user.role === 'admin' ? 'primary' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{user.department || '-'}</TableCell>
                                    <TableCell>{user.position || '-'}</TableCell>
                                    <TableCell align="center">{user.tasksCompleted || 0}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={`${user.productivityScore?.toFixed(0) || 0}%`}
                                            color={
                                                user.productivityScore >= 70
                                                    ? 'success'
                                                    : user.productivityScore >= 40
                                                        ? 'warning'
                                                        : 'error'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={user.isActive ? 'Active' : 'Inactive'}
                                            color={user.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenDialog(user)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(user._id)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    <Typography variant="body1" color="textSecondary">
                                        No users found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit User Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            select
                            label="Role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            margin="normal"
                        >
                            <MenuItem value="employee">Employee</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </TextField>
                        {formData.role === 'employee' && (
                            <>
                                <TextField
                                    fullWidth
                                    select
                                    label="Department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    margin="normal"
                                >
                                    <MenuItem value="">Select Department</MenuItem>
                                    {departments.map((dept) => (
                                        <MenuItem key={dept} value={dept}>
                                            {dept}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    fullWidth
                                    select
                                    label="Position"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    margin="normal"
                                >
                                    <MenuItem value="">Select Position</MenuItem>
                                    {positions.map((pos) => (
                                        <MenuItem key={pos} value={pos}>
                                            {pos}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </>
                        )}
                        <TextField
                            fullWidth
                            select
                            label="Status"
                            name="isActive"
                            value={formData.isActive}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    isActive: e.target.value === 'true',
                                }))
                            }
                            margin="normal"
                        >
                            <MenuItem value={true}>Active</MenuItem>
                            <MenuItem value={false}>Inactive</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={updateUserMutation.isLoading}
                    >
                        {updateUserMutation.isLoading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Users;
