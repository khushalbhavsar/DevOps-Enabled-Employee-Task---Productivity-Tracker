import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    Typography,
    Box,
    Paper,
    Grid,
    Card,
    CardContent,
    Avatar,
    Divider,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import BadgeIcon from '@mui/icons-material/Badge';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        department: user?.department || '',
        position: user?.position || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Fetch user statistics
    const { data: stats } = useQuery('userStats', async () => {
        if (user?.role === 'admin') {
            const response = await api.get('/analytics/dashboard');
            return response.data.data;
        } else {
            const response = await api.get(`/analytics/employee/${user.id}`);
            return response.data.data;
        }
    });

    // Fetch recent tasks
    const { data: recentTasks } = useQuery('profileTasks', async () => {
        const response = await api.get('/tasks?limit=3');
        return response.data.data;
    });

    // Update profile mutation
    const updateProfileMutation = useMutation(
        async (data) => {
            const response = await api.put(`/users/${user.id}`, data);
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('userStats');
                toast.success('Profile updated successfully!');
                setOpenEditDialog(false);
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to update profile');
            },
        }
    );

    const handleEditDialogOpen = () => {
        setEditFormData({
            name: user?.name || '',
            email: user?.email || '',
            department: user?.department || '',
            position: user?.position || '',
        });
        setOpenEditDialog(true);
    };

    const handleEditDialogClose = () => {
        setOpenEditDialog(false);
    };

    const handlePasswordDialogOpen = () => {
        setOpenPasswordDialog(true);
    };

    const handlePasswordDialogClose = () => {
        setOpenPasswordDialog(false);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = () => {
        if (!editFormData.name || !editFormData.email) {
            toast.error('Name and email are required');
            return;
        }
        updateProfileMutation.mutate(editFormData);
    };

    const handleChangePassword = () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error('All password fields are required');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        toast.info('Password change feature coming soon!');
        handlePasswordDialogClose();
    };

    const getInitials = (name) => {
        return name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
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
                <Grid container spacing={3} alignItems="center">
                    <Grid item>
                        <Avatar
                            sx={{
                                width: 120,
                                height: 120,
                                bgcolor: 'white',
                                color: '#667eea',
                                fontSize: '3rem',
                                fontWeight: 'bold',
                                boxShadow: 4,
                            }}
                        >
                            {getInitials(user?.name)}
                        </Avatar>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h3" fontWeight="bold" gutterBottom>
                            {user?.name}
                        </Typography>
                        <Box display="flex" gap={2} alignItems="center">
                            <Chip
                                label={user?.role?.toUpperCase()}
                                sx={{
                                    bgcolor: 'white',
                                    color: '#667eea',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                }}
                            />
                            <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                {user?.position || 'Position not set'}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={handleEditDialogOpen}
                            sx={{
                                bgcolor: 'white',
                                color: '#667eea',
                                fontWeight: 'bold',
                                px: 3,
                                py: 1.5,
                                '&:hover': {
                                    bgcolor: '#f0f0f0',
                                },
                            }}
                        >
                            Edit Profile
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            <Grid container spacing={3}>
                {/* Personal Information Card */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                📋 Personal Information
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <PersonIcon color="primary" />
                                    <Box>
                                        <Typography variant="caption" color="textSecondary">
                                            Full Name
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {user?.name}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <EmailIcon color="primary" />
                                    <Box>
                                        <Typography variant="caption" color="textSecondary">
                                            Email Address
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {user?.email}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <BadgeIcon color="primary" />
                                    <Box>
                                        <Typography variant="caption" color="textSecondary">
                                            Role
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <WorkIcon color="primary" />
                                    <Box>
                                        <Typography variant="caption" color="textSecondary">
                                            Department
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {user?.department || 'Not specified'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<SecurityIcon />}
                                onClick={handlePasswordDialogOpen}
                                sx={{ mt: 2 }}
                            >
                                Change Password
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Statistics Card */}
                <Grid item xs={12} md={8}>
                    <Card elevation={3} sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                📊 {user?.role === 'admin' ? 'Team Statistics' : 'My Statistics'}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            bgcolor: '#e3f2fd',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <AssignmentIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                                        <Typography variant="h4" fontWeight="bold" color="#1976d2">
                                            {stats?.totalTasks || 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Total Tasks
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            bgcolor: '#e8f5e9',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <CheckCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                        <Typography variant="h4" fontWeight="bold" color="#2e7d32">
                                            {stats?.completedTasks || 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Completed
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            bgcolor: '#fff3e0',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <PendingIcon sx={{ fontSize: 40, color: '#ed6c02' }} />
                                        <Typography variant="h4" fontWeight="bold" color="#ed6c02">
                                            {stats?.pendingTasks || 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Pending
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            bgcolor: '#f3e5f5',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <TrendingUpIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
                                        <Typography variant="h4" fontWeight="bold" color="#9c27b0">
                                            {user?.role === 'admin'
                                                ? `${stats?.completionRate || 0}%`
                                                : `${stats?.productivityScore || 0}%`}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {user?.role === 'admin' ? 'Completion Rate' : 'Productivity'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {user?.role === 'employee' && stats?.productivityScore && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Productivity Score
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={stats.productivityScore}
                                        sx={{
                                            height: 10,
                                            borderRadius: 5,
                                            bgcolor: '#e0e0e0',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor:
                                                    stats.productivityScore >= 70
                                                        ? '#4caf50'
                                                        : stats.productivityScore >= 40
                                                            ? '#ff9800'
                                                            : '#f44336',
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Tasks */}
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                📌 Recent Tasks
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            {recentTasks && recentTasks.length > 0 ? (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                <TableCell><strong>Task</strong></TableCell>
                                                <TableCell align="center"><strong>Status</strong></TableCell>
                                                <TableCell align="center"><strong>Priority</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {recentTasks.map((task) => (
                                                <TableRow key={task._id}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {task.title}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={task.status}
                                                            size="small"
                                                            color={
                                                                task.status === 'completed'
                                                                    ? 'success'
                                                                    : task.status === 'in-progress'
                                                                        ? 'primary'
                                                                        : 'warning'
                                                            }
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={task.priority}
                                                            size="small"
                                                            color={
                                                                task.priority === 'high' || task.priority === 'urgent'
                                                                    ? 'error'
                                                                    : task.priority === 'medium'
                                                                        ? 'warning'
                                                                        : 'info'
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No recent tasks found
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Edit Profile Dialog */}
            <Dialog open={openEditDialog} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 'bold' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <EditIcon />
                        Edit Profile
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                name="name"
                                value={editFormData.name}
                                onChange={handleEditFormChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={editFormData.email}
                                onChange={handleEditFormChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Department"
                                name="department"
                                value={editFormData.department}
                                onChange={handleEditFormChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Position"
                                name="position"
                                value={editFormData.position}
                                onChange={handleEditFormChange}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                    <Button onClick={handleEditDialogClose} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateProfile}
                        variant="contained"
                        disabled={updateProfileMutation.isLoading}
                        sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
                    >
                        {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={openPasswordDialog} onClose={handlePasswordDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 'bold' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <SecurityIcon />
                        Change Password
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Current Password"
                                name="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Password"
                                name="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                                helperText="Must be at least 6 characters"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                name="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                    <Button onClick={handlePasswordDialogClose} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleChangePassword}
                        variant="contained"
                        sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
                    >
                        Change Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Profile;
