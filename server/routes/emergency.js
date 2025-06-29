const express = require('express');
const Vehicle = require('../models/Vehicle');
const TrafficSignal = require('../models/TrafficSignal');
const { auth, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Get all emergency vehicles
router.get('/vehicles', auth, async (req, res) => {
  try {
    const emergencyVehicles = await Vehicle.find({ 
      emergencyPriority: true,
      status: 'emergency'
    }).sort({ detectedAt: -1 });

    res.json({ emergencyVehicles });
  } catch (error) {
    console.error('Get emergency vehicles error:', error);
    res.status(500).json({ message: 'Error fetching emergency vehicles' });
  }
});

// Create emergency alert
router.post('/alert', auth, checkPermission('manage_emergency'), async (req, res) => {
  try {
    const { vehicleId, emergencyType, location, priority, description } = req.body;

    // Find or create emergency vehicle
    let vehicle = await Vehicle.findOne({ vehicleId });
    
    if (!vehicle) {
      vehicle = new Vehicle({
        vehicleId,
        type: 'emergency',
        emergencyPriority: true,
        emergencyType,
        location,
        status: 'emergency',
        speed: 0,
        direction: 'north'
      });
    } else {
      vehicle.emergencyPriority = true;
      vehicle.emergencyType = emergencyType;
      vehicle.status = 'emergency';
      if (location) vehicle.location = location;
    }

    await vehicle.save();

    // Find nearby signals and set emergency priority
    const nearbySignals = await TrafficSignal.findNearby(location.coordinates, 2000);
    
    for (const signal of nearbySignals) {
      await signal.addEmergencyVehicle({
        vehicleId,
        priority: priority || 1,
        estimatedArrival: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('emergency-alert', { 
      vehicle, 
      nearbySignals: nearbySignals.length,
      description 
    });

    res.status(201).json({
      message: 'Emergency alert created successfully',
      vehicle,
      affectedSignals: nearbySignals.length
    });
  } catch (error) {
    console.error('Create emergency alert error:', error);
    res.status(500).json({ message: 'Error creating emergency alert' });
  }
});

// Clear emergency alert
router.delete('/alert/:vehicleId', auth, checkPermission('manage_emergency'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId });
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Emergency vehicle not found' });
    }

    vehicle.emergencyPriority = false;
    vehicle.emergencyType = 'none';
    vehicle.status = 'moving';
    await vehicle.save();

    // Clear emergency priority from signals
    const signals = await TrafficSignal.find({ 'emergencyVehicles.vehicleId': req.params.vehicleId });
    
    for (const signal of signals) {
      await signal.removeEmergencyVehicle(req.params.vehicleId);
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('emergency-cleared', { vehicleId: req.params.vehicleId });

    res.json({ message: 'Emergency alert cleared successfully' });
  } catch (error) {
    console.error('Clear emergency alert error:', error);
    res.status(500).json({ message: 'Error clearing emergency alert' });
  }
});

// Get emergency statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
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
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const [
      totalEmergencyVehicles,
      activeEmergencyVehicles,
      emergencyTypes
    ] = await Promise.all([
      Vehicle.countDocuments({ 
        emergencyPriority: true,
        detectedAt: { $gte: startTime }
      }),
      Vehicle.countDocuments({ 
        emergencyPriority: true,
        status: 'emergency'
      }),
      Vehicle.aggregate([
        {
          $match: {
            emergencyPriority: true,
            detectedAt: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: '$emergencyType',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const stats = {
      period,
      totalEmergencyVehicles,
      activeEmergencyVehicles,
      emergencyTypes: emergencyTypes.reduce((acc, type) => {
        acc[type._id] = type.count;
        return acc;
      }, {})
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get emergency stats error:', error);
    res.status(500).json({ message: 'Error fetching emergency statistics' });
  }
});

module.exports = router; 