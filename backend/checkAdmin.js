require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');  // Using native bcrypt
const connectDB = require('./config/db');

const resetAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Access the users collection directly
    const db = mongoose.connection.db;
    const users = db.collection('users');
    
    // Define admin credentials
    const adminEmail = 'admin@example.com';
    const plainPassword = 'Admin@123';
    
    // Create a new hash with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log('Generated new password hash:', hashedPassword);
    
    // Update the admin user directly in the database
    const result = await users.updateOne(
      { email: adminEmail },
      { $set: { password: hashedPassword } }
    );
    
    if (result.matchedCount === 0) {
      console.log('Admin user not found. Creating new admin...');
      
      // Create new admin if not found
      const newAdmin = {
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await users.insertOne(newAdmin);
      console.log('Admin user created successfully');
    } else {
      console.log('Admin password reset successfully');
    }
    
    // Verify the update
    const updatedAdmin = await users.findOne({ email: adminEmail });
    console.log('Admin user now has password hash:', updatedAdmin.password);
    
    // Test password verification logic
    const isMatch = await bcrypt.compare(plainPassword, updatedAdmin.password);
    console.log('Verification test passed:', isMatch);
    
    if (!isMatch) {
      console.error('ERROR: Password verification failed! There might be an issue with bcrypt.');
    } else {
      console.log('✅ Password verification successful. You should now be able to log in.');
      console.log('Admin credentials:');
      console.log('- Email:', adminEmail);
      console.log('- Password:', plainPassword); 
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the reset function
resetAdmin();