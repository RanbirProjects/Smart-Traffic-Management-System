const express = require('express');
const TrafficSignal = require('../models/TrafficSignal');
const { auth, authorize, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Get all traffic signals
router.get('/', auth, async (req, res) => {
  try {
    const { status, location } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (location) {
      const [lng, lat] = location.split(',').map(Number);
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: 5000 // 5km radius
        }
      };
    }

    const signals = await TrafficSignal.find(query);
    res.json({ signals });
  } catch (error) {
    console.error('Get signals error:', error);
    res.status(500).json({ message: 'Error fetching traffic signals' });
  }
});

// Get single traffic signal
router.get('/:signalId', auth, async (req, res) => {
  try {
    const signal = await TrafficSignal.findOne({ signalId: req.params.signalId });
    
    if (!signal) {
      return res.status(404).json({ message: 'Traffic signal not found' });
    }

    res.json({ signal });
  } catch (error) {
    console.error('Get signal error:', error);
    res.status(500).json({ message: 'Error fetching traffic signal' });
  }
});

// Create new traffic signal
router.post('/', auth, checkPermission('manage_signals'), async (req, res) => {
  try {
    const {
      signalId,
      location,
      address,
      intersection,
      phase
    } = req.body;

    // Check if signal already exists
    const existingSignal = await TrafficSignal.findOne({ signalId });
    if (existingSignal) {
      return res.status(400).json({ message: 'Traffic signal with this ID already exists' });
    }

    const signal = new TrafficSignal({
      signalId,
      location,
      address,
      intersection,
      phase
    });

    await signal.save();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('signal-added', { signal });

    res.status(201).json({
      message: 'Traffic signal created successfully',
      signal
    });
  } catch (error) {
    console.error('Create signal error:', error);
    res.status(500).json({ message: 'Error creating traffic signal' });
  }
});

// Update traffic signal
router.put('/:signalId', auth, checkPermission('manage_signals'), async (req, res) => {
  try {
    const updates = req.body;
    delete updates.signalId; // Prevent changing the signal ID

    const signal = await TrafficSignal.findOneAndUpdate(
      { signalId: req.params.signalId },
      updates,
      { new: true, runValidators: true }
    );

    if (!signal) {
      return res.status(404).json({ message: 'Traffic signal not found' });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('signal-updated', { signal });

    res.json({
      message: 'Traffic signal updated successfully',
      signal
    });
  } catch (error) {
    console.error('Update signal error:', error);
    res.status(500).json({ message: 'Error updating traffic signal' });
  }
});

// Update signal state
router.put('/:signalId/state', auth, checkPermission('manage_signals'), async (req, res) => {
  try {
    const { state, duration } = req.body;
    const signal = await TrafficSignal.findOne({ signalId: req.params.signalId });

    if (!signal) {
      return res.status(404).json({ message: 'Traffic signal not found' });
    }

    await signal.updateState(state, duration);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('signal-status-changed', { 
      signalId: signal.signalId,
      state: signal.currentState,
      nextChange: signal.timing.nextChange
    });

    res.json({
      message: 'Signal state updated successfully',
      signal
    });
  } catch (error) {
    console.error('Update state error:', error);
    res.status(500).json({ message: 'Error updating signal state' });
  }
});

// Configure signal timing
router.put('/:signalId/timing', auth, checkPermission('manage_signals'), async (req, res) => {
  try {
    const { phase, cycleLength } = req.body;
    const signal = await TrafficSignal.findOne({ signalId: req.params.signalId });

    if (!signal) {
      return res.status(404).json({ message: 'Traffic signal not found' });
    }

    if (phase) {
      signal.phase = { ...signal.phase, ...phase };
    }

    if (cycleLength) {
      signal.timing.cycleLength = cycleLength;
    }

    await signal.save();

    res.json({
      message: 'Signal timing configured successfully',
      signal
    });
  } catch (error) {
    console.error('Configure timing error:', error);
    res.status(500).json({ message: 'Error configuring signal timing' });
  }
});

// Add sensor to signal
router.post('/:signalId/sensors', auth, checkPermission('manage_signals'), async (req, res) => {
  try {
    const { sensorId, type, location } = req.body;
    const signal = await TrafficSignal.findOne({ signalId: req.params.signalId });

    if (!signal) {
      return res.status(404).json({ message: 'Traffic signal not found' });
    }

    signal.sensors.push({
      sensorId,
      type,
      location
    });

    await signal.save();

    res.json({
      message: 'Sensor added successfully',
      signal
    });
  } catch (error) {
    console.error('Add sensor error:', error);
    res.status(500).json({ message: 'Error adding sensor' });
  }
});

// Remove sensor from signal
router.delete('/:signalId/sensors/:sensorId', auth, checkPermission('manage_signals'), async (req, res) => {
  try {
    const signal = await TrafficSignal.findOne({ signalId: req.params.signalId });

    if (!signal) {
      return res.status(404).json({ message: 'Traffic signal not found' });
    }

    signal.sensors = signal.sensors.filter(
      sensor => sensor.sensorId !== req.params.sensorId
    );

    await signal.save();

    res.json({
      message: 'Sensor removed successfully',
      signal
    });
  } catch (error) {
    console.error('Remove sensor error:', error);
    res.status(500).json({ message: 'Error removing sensor' });
  }
});

// Get signal statistics
router.get('/:signalId/stats', auth, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    const signal = await TrafficSignal.findOne({ signalId: req.params.signalId });

    if (!signal) {
      return res.status(404).json({ message: 'Traffic signal not found' });
    }

    // Calculate time range
    const now = new Date();
    let startTime;
    
    switch (period) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Calculate basic statistics
    const totalFlow = Object.values(signal.trafficFlow).reduce((sum, count) => sum + count, 0);
    const avgSpeed = Object.values(signal.trafficFlow).reduce((sum, count) => sum + count, 0) / 4;

    const stats = {
      signalId: signal.signalId,
      period,
      totalVehicles: totalFlow,
      averageSpeed: avgSpeed,
      currentState: signal.currentState,
      status: signal.status,
      emergencyPriority: signal.emergencyPriority,
      lastUpdate: signal.timing.lastChange,
      trafficFlow: signal.trafficFlow,
      sensors: signal.sensors.length
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error fetching signal statistics' });
  }
});

// Delete traffic signal
router.delete('/:signalId', auth, authorize('admin'), async (req, res) => {
  try {
    const signal = await TrafficSignal.findOneAndDelete({ signalId: req.params.signalId });

    if (!signal) {
      return res.status(404).json({ message: 'Traffic signal not found' });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('signal-deleted', { signalId: req.params.signalId });

    res.json({ message: 'Traffic signal deleted successfully' });
  } catch (error) {
    console.error('Delete signal error:', error);
    res.status(500).json({ message: 'Error deleting traffic signal' });
  }
});

module.exports = router; 