const mongoose = require('mongoose');
const User = require('./src/models/User');
const Task = require('./src/models/Task');
require('dotenv').config();

const clearDatabase = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MongoDB URI not found in environment variables');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Count documents before deletion
        const userCount = await User.countDocuments();
        const taskCount = await Task.countDocuments();
        console.log(`\n📊 Before deletion:`);
        console.log(`   Users: ${userCount}`);
        console.log(`   Tasks: ${taskCount}`);

        // Delete all users
        const deletedUsers = await User.deleteMany({});
        console.log(`\n🗑️  Deleted ${deletedUsers.deletedCount} users`);

        // Delete all tasks
        const deletedTasks = await Task.deleteMany({});
        console.log(`🗑️  Deleted ${deletedTasks.deletedCount} tasks`);

        // Verify deletion
        const remainingUsers = await User.countDocuments();
        const remainingTasks = await Task.countDocuments();
        console.log(`\n📊 After deletion:`);
        console.log(`   Users: ${remainingUsers}`);
        console.log(`   Tasks: ${remainingTasks}`);

        console.log('\n✅ Database cleared successfully!');

        // Close connection
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    }
};

clearDatabase();
