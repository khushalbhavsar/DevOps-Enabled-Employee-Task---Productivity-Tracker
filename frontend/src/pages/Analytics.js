import React from 'react';
import { useQuery } from 'react-query';
import {
    Box,
    Typography,
    Grid,
    Paper,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
} from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Analytics = () => {
    const { user } = useAuth();

    // Fetch dashboard data for admin or employee performance
    const { data: analyticsData, isLoading } = useQuery(
        ['analytics', user?.id],
        async () => {
            if (user?.role === 'admin') {
                const [dashboardRes, teamRes] = await Promise.all([
                    api.get('/analytics/dashboard'),
                    api.get('/analytics/team'),
                ]);
                return {
                    dashboard: dashboardRes.data.data,
                    team: teamRes.data.data,
                };
            } else {
                const res = await api.get(`/analytics/employee/${user.id}`);
                return { employee: res.data.data };
            }
        }
    );

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    // Prepare data for charts
    const prepareTasksByPriority = () => {
        if (!analyticsData?.dashboard?.tasksByPriority) return [];
        return analyticsData.dashboard.tasksByPriority.map((item) => ({
            name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
            value: item.count,
        }));
    };

    const prepareTaskStatusData = () => {
        if (!analyticsData?.dashboard) return [];
        return [
            { name: 'Completed', value: analyticsData.dashboard.completedTasks },
            { name: 'In Progress', value: analyticsData.dashboard.inProgressTasks },
            { name: 'Pending', value: analyticsData.dashboard.pendingTasks },
            { name: 'Overdue', value: analyticsData.dashboard.overdueTasks },
        ];
    };

    if (user?.role === 'admin') {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Analytics Dashboard
                </Typography>
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
                    Comprehensive overview of team performance and task metrics
                </Typography>

                {/* Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Tasks
                                </Typography>
                                <Typography variant="h4">
                                    {analyticsData?.dashboard?.totalTasks || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Completion Rate
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    {analyticsData?.dashboard?.completionRate || 0}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Active Employees
                                </Typography>
                                <Typography variant="h4">
                                    {analyticsData?.team?.totalEmployees || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Avg. Productivity
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    {analyticsData?.team?.averageProductivity || 0}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Charts */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Tasks by Status
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={prepareTaskStatusData()}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) =>
                                            `${name} ${(percent * 100).toFixed(0)}%`
                                        }
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {prepareTaskStatusData().map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Tasks by Priority
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={prepareTasksByPriority()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8884d8" name="Tasks" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Team Performance Table */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Team Performance
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Employee</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell align="center"><strong>Tasks Completed</strong></TableCell>
                                    <TableCell align="center"><strong>Productivity Score</strong></TableCell>
                                    <TableCell align="center"><strong>Trend</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {analyticsData?.team?.employees?.map((emp) => (
                                    <TableRow key={emp._id}>
                                        <TableCell>{emp.name}</TableCell>
                                        <TableCell>{emp.email}</TableCell>
                                        <TableCell align="center">{emp.tasksCompleted}</TableCell>
                                        <TableCell align="center">
                                            <Typography
                                                color={
                                                    emp.productivityScore >= 70
                                                        ? 'success.main'
                                                        : emp.productivityScore >= 40
                                                            ? 'warning.main'
                                                            : 'error.main'
                                                }
                                            >
                                                {emp.productivityScore.toFixed(1)}%
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            {emp.productivityScore >= 50 ? (
                                                <TrendingUpIcon color="success" />
                                            ) : (
                                                <TrendingDownIcon color="error" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        );
    }

    // Employee view
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                My Performance Analytics
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
                Track your productivity and task completion metrics
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Tasks
                            </Typography>
                            <Typography variant="h4">
                                {analyticsData?.employee?.totalTasks || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Completed
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {analyticsData?.employee?.completedTasks || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Pending
                            </Typography>
                            <Typography variant="h4" color="warning.main">
                                {analyticsData?.employee?.pendingTasks || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Productivity Score
                            </Typography>
                            <Typography variant="h4" color="primary">
                                {analyticsData?.employee?.productivityScore || 0}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Completion Rate
                        </Typography>
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h2" color="primary">
                                {analyticsData?.employee?.completionRate || 0}%
                            </Typography>
                            <Typography color="textSecondary" sx={{ mt: 1 }}>
                                Tasks completed successfully
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            On-Time Delivery
                        </Typography>
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h2" color="success.main">
                                {analyticsData?.employee?.onTimeRate || 0}%
                            </Typography>
                            <Typography color="textSecondary" sx={{ mt: 1 }}>
                                Tasks completed before deadline
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Analytics;
