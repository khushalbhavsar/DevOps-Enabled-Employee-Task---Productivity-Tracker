import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    MenuItem,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        position: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(formData);
            toast.success('Registration successful!');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            toast.error('Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Create Account
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Full Name"
                            name="name"
                            autoFocus
                            value={formData.name}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            select
                            label="Role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <MenuItem value="employee">Employee</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </TextField>
                        {formData.role === 'employee' && (
                            <>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    select
                                    label="Department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select Department</MenuItem>
                                    {departments.map((dept) => (
                                        <MenuItem key={dept} value={dept}>
                                            {dept}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    select
                                    label="Position"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    required
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
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <Typography variant="body2" color="primary">
                                    Already have an account? Sign In
                                </Typography>
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;
