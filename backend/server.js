const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const app = express();
const PORT = 4000;
const SECRET = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890abcdefABCDEFGH';

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());

// =========================
// MONGODB CONNECTION
// =========================
mongoose
  .connect('mongodb://127.0.0.1:27017/smart_farming_monitor')
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
  });

// =========================
// USER SCHEMA
// =========================
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'student',
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

// =========================
// FARM DATA SCHEMA
// =========================
const farmRecordSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    lat: {
      type: String,
      default: '0.00',
    },
    lng: {
      type: String,
      default: '0.00',
    },
    temp: {
      type: String,
      default: '0',
    },
    humidity: {
      type: String,
      default: '0',
    },
    moisture: {
      type: String,
      default: '0',
    },
    ph: {
      type: String,
      default: '0',
    },
    crop: {
      type: String,
      default: 'N/A',
    },
    status: {
      type: String,
      default: 'NORMAL',
    },
    time: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const FarmRecord = mongoose.model('FarmRecord', farmRecordSchema);

// =========================
// HOME ROUTE
// =========================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Farming backend is running',
  });
});

// =========================
// API DEVICES ROUTE FOR POLLER
// =========================
app.get('/api/devices', async (req, res) => {
  try {
    const records = await FarmRecord.find().sort({ createdAt: -1 }).limit(20);

    const devices = records.map((record, index) => ({
      id: record._id.toString(),
      lat: parseFloat(record.lat) || 11.0168,
      lon: parseFloat(record.lng) || 76.9558,
      actuator: 'OFF',
      ph_baseline: parseFloat(record.ph) || 6.5,
      name: `Device ${index + 1}`,
    }));

    // fallback if no records exist
    if (devices.length === 0) {
      return res.json([
        {
          id: 'device1',
          lat: 11.0168,
          lon: 76.9558,
          actuator: 'OFF',
          ph_baseline: 6.5,
          name: 'Default Device',
        },
      ]);
    }

    res.json(devices);
  } catch (error) {
    console.error('Devices fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch devices',
    });
  }
});

// =========================
// API READINGS ROUTE FOR POLLER
// =========================
app.post('/api/readings', async (req, res) => {
  try {
    const { deviceId, ts, temperature, humidity, soil_moisture, light, ph } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required',
      });
    }
    

    const newRecord = new FarmRecord({
      userEmail: 'poller@system.local',
      lat: '11.0168',
      lng: '76.9558',
      temp: String(temperature ?? 0),
      humidity: String(humidity ?? 0),
      moisture: String(soil_moisture ?? 0),
      ph: String(ph ?? 6.5),
      crop: 'Auto Monitor',
      status: `LIGHT_${light ?? 0}`,
      time: ts || new Date().toISOString(),
    });

    await newRecord.save();

    res.status(201).json({
      success: true,
      message: 'Reading saved successfully',
      record: newRecord,
    });
  } catch (error) {
    console.error('Readings save error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save reading',
    });
  }
});

// =========================
// REGISTER
// =========================
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'student',
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
});

// =========================
// LOGIN
// =========================
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
});

// =========================
// FORGOT PASSWORD / RESET
// =========================
app.post('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Check input
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully ✅'
    });

  } catch (error) {
    console.error('Forgot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
// =========================
// GET USER PROFILE
// =========================
app.get('/profile/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();

    const user = await User.findOne({ email }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
});

// =========================
// SAVE FARM RECORD
// =========================
app.post('/farm-data', async (req, res) => {
  try {
    const {
      userEmail,
      lat,
      lng,
      temp,
      humidity,
      moisture,
      ph,
      crop,
      status,
      time,
    } = req.body;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required',
      });
    }

    const newRecord = new FarmRecord({
      userEmail: userEmail.toLowerCase(),
      lat,
      lng,
      temp,
      humidity,
      moisture,
      ph,
      crop,
      status,
      time,
    });

    await newRecord.save();

    res.status(201).json({
      success: true,
      message: 'Farm record saved successfully',
      record: newRecord,
    });
  } catch (error) {
    console.error('Save farm data error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save farm data',
    });
  }
});

// =========================
// GET ALL FARM RECORDS BY USER
// =========================
app.get('/farm-data/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();

    const records = await FarmRecord.find({ userEmail: email }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      records,
    });
  } catch (error) {
    console.error('Get farm data error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farm data',
    });
  }
});

// =========================
// DELETE FARM RECORD
// =========================
app.delete('/farm-data/:id', async (req, res) => {
  try {
    const deletedRecord = await FarmRecord.findByIdAndDelete(req.params.id);

    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error) {
    console.error('Delete farm data error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete record',
    });
  }
});

// =========================
// SERVER START
// =========================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});