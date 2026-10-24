const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'fixmycity';

  if (!mongoUri) {
    console.error('\n❌ [MongoDB Error] MONGODB_URI environment variable is missing in backend/.env.');
    throw new Error('MONGODB_URI is missing');
  }

  try {
    console.log('[MongoDB] Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(mongoUri, {
      dbName,
      serverSelectionTimeoutMS: 6000,
    });

    console.log(`✅ [MongoDB Connected] Host: ${conn.connection.host} | Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('\n❌ [MongoDB Connection Error]:', error.message);

    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.log('\n========================================================================');
      console.log('🔑 ACTION REQUIRED: Atlas Database User Authentication Failed');
      console.log('------------------------------------------------------------------------');
      console.log('Your network connection reached Atlas, but the username or password');
      console.log('in your backend/.env MONGODB_URI was rejected.\n');
      console.log('How to fix this in 1 minute:');
      console.log('1. Go to: https://cloud.mongodb.com/');
      console.log('2. In the left sidebar under "Security", click "Database Access"');
      console.log('3. Look at your database users:');
      console.log('   - If you see your user, click "Edit" -> "Edit Password"');
      console.log('   - Type a new password (e.g. "MySecretPass123")');
      console.log('   - Click "Update User"');
      console.log('   - (Or click "Add New Database User", select "Password", give it readWriteAnyDatabase)');
      console.log('4. In backend/.env, update MONGODB_URI with the new password:');
      console.log('   mongodb+srv://<username>:<new_password>@fixmycity.n2d1qoa.mongodb.net/?appName=FixMyCity');
      console.log('========================================================================\n');
    } else if (error.message.includes('whitelist') || error.message.includes('SSL') || error.message.includes('tlsv1 alert')) {
      console.log('\n========================================================================');
      console.log('⚠️  ACTION REQUIRED: MongoDB Atlas IP Whitelist');
      console.log('------------------------------------------------------------------------');
      console.log('Go to https://cloud.mongodb.com/ -> Security -> Network Access');
      console.log('Click "Add IP Address" -> "Allow Access From Anywhere" (0.0.0.0/0) -> Confirm');
      console.log('========================================================================\n');
    }

    throw error;
  }
};

module.exports = connectDB;
