const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PlantAnalysis = require('./models/PlantAnalysis');

const app = express();
const PORT = process.env.PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'smartfarm_tea_aiot_secure_secret_key_2026';

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
// Allow up to 25MB for base64 tea leaf image payloads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// =========================
// MONGODB CONNECTION
// =========================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_farming_monitor';

mongoose
  .connect(MONGO_URI)
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

const User = mongoose.models.User || mongoose.model('User', userSchema);

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

const FarmRecord = mongoose.models.FarmRecord || mongoose.model('FarmRecord', farmRecordSchema);

// =========================
// HOME & HEALTH ROUTES
// =========================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Farming AIoT backend is running',
    version: '1.2.0',
    service: 'Tea Plantation AIoT Suite',
  });
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    success: true,
    status: 'healthy',
    database: dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected',
    timestamp: new Date().toISOString(),
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
      name: `Tea Zone Device ${index + 1}`,
    }));

    if (devices.length === 0) {
      return res.json([
        {
          id: 'device1',
          lat: 11.0168,
          lon: 76.9558,
          actuator: 'OFF',
          ph_baseline: 5.2,
          name: 'Block A - Sensor Station',
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
      ph: String(ph ?? 5.2),
      crop: 'Camellia Sinensis (Tea)',
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

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
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

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Forgot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
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
      crop: crop || 'Camellia Sinensis (Tea)',
      status: status || 'NORMAL',
      time: time || new Date().toISOString(),
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
// PLANT IMAGE ANALYSIS API (PHASE 1)
// =========================

// POST /api/plant-analysis - Save uploaded tea leaf specimen for analysis
app.post('/api/plant-analysis', async (req, res) => {
  try {
    const {
      userEmail,
      title,
      plantationBlock,
      cultivar,
      specimenStage,
      imageUrl,
      symptomsObserved,
      notes,
      gps,
      status,
      aiInferenceState,
      expertNotes,
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Plant specimen image is required',
      });
    }

    const newAnalysis = new PlantAnalysis({
      userEmail: (userEmail || 'operator@plantation.local').toLowerCase(),
      title: title || 'Tea Leaf Health Scan',
      plantationBlock: plantationBlock || 'Block A - Camellia Sinensis (Upper Valley)',
      cultivar: cultivar || 'Camellia sinensis var. sinensis',
      specimenStage: specimenStage || 'Flush (Two Leaves & a Bud)',
      imageUrl,
      symptomsObserved: symptomsObserved || '',
      notes: notes || '',
      gps: gps || { lat: '11.0168', lng: '76.9558' },
      status: status || 'Queued for Analysis',
      aiInferenceState: aiInferenceState || 'Pending Model Service Connection',
      expertNotes: expertNotes || '',
      time: new Date().toISOString(),
    });

    await newAnalysis.save();

    res.status(201).json({
      success: true,
      message: 'Specimen registered in plantation database successfully',
      record: newAnalysis,
    });
  } catch (error) {
    console.error('Save plant analysis error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save plant analysis record',
      error: error.message,
    });
  }
});

// GET /api/plant-analysis - Get all records (or query by userEmail / block / status)
app.get('/api/plant-analysis', async (req, res) => {
  try {
    const filter = {};
    if (req.query.userEmail) {
      filter.userEmail = req.query.userEmail.toLowerCase();
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.plantationBlock) {
      filter.plantationBlock = req.query.plantationBlock;
    }

    const records = await PlantAnalysis.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('Get all plant analysis error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plant analysis records',
    });
  }
});

// GET /api/plant-analysis/:email - Get records for specific user email
app.get('/api/plant-analysis/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    let records;
    if (email === 'all' || email === 'admin') {
      records = await PlantAnalysis.find().sort({ createdAt: -1 });
    } else {
      records = await PlantAnalysis.find({
        $or: [{ userEmail: email }, { userEmail: 'operator@plantation.local' }],
      }).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('Get plant analysis by email error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plant analysis records',
    });
  }
});

// PATCH /api/plant-analysis/:id/status - Update expert verification status & notes
app.patch('/api/plant-analysis/:id/status', async (req, res) => {
  try {
    const { status, expertNotes, verifiedBy } = req.body;

    const record = await PlantAnalysis.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found',
      });
    }

    if (status) record.status = status;
    if (expertNotes !== undefined) record.expertNotes = expertNotes;
    if (verifiedBy) record.verifiedBy = verifiedBy;

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Verification status updated successfully',
      record,
    });
  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update verification status',
    });
  }
});

// DELETE /api/plant-analysis/:id - Delete an analysis record
app.delete('/api/plant-analysis/:id', async (req, res) => {
  try {
    const deletedRecord = await PlantAnalysis.findByIdAndDelete(req.params.id);

    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Plant analysis record deleted successfully',
    });
  } catch (error) {
    console.error('Delete plant analysis error:', error.message);
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