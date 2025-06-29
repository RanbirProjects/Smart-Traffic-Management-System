const express = require('express');
const Vehicle = require('../models/Vehicle');
const { auth, checkPermission, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all vehicles
router.get('/', auth, async (req, res) => {
  try {
    const { type, status, emergency, signalId, limit = 100 } = req.query;
    let query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (emergency === 'true') query.emergencyPriority = true;
    if (signalId) query.signalId = signalId;

    const vehicles = await Vehicle.find(query)
      .sort({ detectedAt: -1 })
      .limit(parseInt(limit));

    res.json({ vehicles });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
});

// Get single vehicle
router.get('/:vehicleId', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId });
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({ vehicle });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ message: 'Error fetching vehicle' });
  }
});

// Create new vehicle detection
router.post('/', auth, async (req, res) => {
  try {
    const {
      vehicleId,
      type,
      licensePlate,
      location,
      speed,
      direction,
      signalId,
      lane
    } = req.body;

    // Check if vehicle already exists
    let vehicle = await Vehicle.findOne({ vehicleId });

    if (vehicle) {
      // Update existing vehicle
      await vehicle.updateLocation(location, speed);
      vehicle.signalId = signalId;
      vehicle.lane = lane;
      await vehicle.save();
    } else {
      // Create new vehicle
      vehicle = new Vehicle({
        vehicleId,
        type,
        licensePlate,
        location,
        speed,
        direction,
        signalId,
        lane
      });
      await vehicle.save();
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('vehicle-detected', { vehicle });

    res.status(201).json({
      message: 'Vehicle detection recorded successfully',
      vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ message: 'Error recording vehicle detection' });
  }
});

// Update vehicle location
router.put('/:vehicleId/location', auth, async (req, res) => {
  try {
    const { location, speed } = req.body;
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.updateLocation(location, speed);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('vehicle-location-updated', { vehicle });

    res.json({
      message: 'Vehicle location updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Error updating vehicle location' });
  }
});

// Set emergency status
router.put('/:vehicleId/emergency', auth, checkPermission('manage_emergency'), async (req, res) => {
  try {
    const { emergencyType } = req.body;
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.setEmergencyStatus(emergencyType);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('emergency-vehicle-approaching', { vehicle });

    res.json({
      message: 'Emergency status set successfully',
      vehicle
    });
  } catch (error) {
    console.error('Set emergency error:', error);
    res.status(500).json({ message: 'Error setting emergency status' });
  }
});

// Clear emergency status
router.delete('/:vehicleId/emergency', auth, checkPermission('manage_emergency'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.clearEmergencyStatus();

    res.json({
      message: 'Emergency status cleared successfully',
      vehicle
    });
  } catch (error) {
    console.error('Clear emergency error:', error);
    res.status(500).json({ message: 'Error clearing emergency status' });
  }
});

// Get emergency vehicles
router.get('/emergency/active', auth, async (req, res) => {
  try {
    const emergencyVehicles = await Vehicle.findEmergencyVehicles();
    res.json({ emergencyVehicles });
  } catch (error) {
    console.error('Get emergency vehicles error:', error);
    res.status(500).json({ message: 'Error fetching emergency vehicles' });
  }
});

// Get traffic flow statistics
router.get('/flow/:signalId', auth, async (req, res) => {
  try {
    const { timeRange = 3600000 } = req.query; // 1 hour default
    const flowStats = await Vehicle.getTrafficFlow(req.params.signalId, parseInt(timeRange));
    
    res.json({ flowStats });
  } catch (error) {
    console.error('Get flow stats error:', error);
    res.status(500).json({ message: 'Error fetching traffic flow statistics' });
  }
});

// Get vehicles by location
router.get('/nearby/:coordinates', auth, async (req, res) => {
  try {
    const { maxDistance = 1000 } = req.query;
    const coordinates = req.params.coordinates.split(',').map(Number);
    
    const nearbyVehicles = await Vehicle.findNearby(coordinates, parseInt(maxDistance));
    
    res.json({ nearbyVehicles });
  } catch (error) {
    console.error('Get nearby vehicles error:', error);
    res.status(500).json({ message: 'Error fetching nearby vehicles' });
  }
});

// Get vehicle route history
router.get('/:vehicleId/route', auth, async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    let query = { vehicleId: req.params.vehicleId };
    
    if (startTime && endTime) {
      query.detectedAt = {
        $gte: new Date(startTime),
        $lte: new Date(endTime)
      };
    }

    const routeHistory = await Vehicle.find(query)
      .sort({ detectedAt: 1 })
      .select('location speed direction signalId detectedAt');

    res.json({ routeHistory });
  } catch (error) {
    console.error('Get route history error:', error);
    res.status(500).json({ message: 'Error fetching route history' });
  }
});

// Bulk vehicle detection
router.post('/bulk', auth, async (req, res) => {
  try {
    const { vehicles } = req.body;
    const results = [];

    for (const vehicleData of vehicles) {
      try {
        let vehicle = await Vehicle.findOne({ vehicleId: vehicleData.vehicleId });

        if (vehicle) {
          await vehicle.updateLocation(vehicleData.location, vehicleData.speed);
          vehicle.signalId = vehicleData.signalId;
          vehicle.lane = vehicleData.lane;
          await vehicle.save();
        } else {
          vehicle = new Vehicle(vehicleData);
          await vehicle.save();
        }

        results.push({ success: true, vehicleId: vehicle.vehicleId });
      } catch (error) {
        results.push({ success: false, vehicleId: vehicleData.vehicleId, error: error.message });
      }
    }

    // Emit socket event for bulk updates
    const io = req.app.get('io');
    io.emit('bulk-vehicle-update', { count: vehicles.length });

    res.json({
      message: 'Bulk vehicle detection processed',
      results
    });
  } catch (error) {
    console.error('Bulk vehicle detection error:', error);
    res.status(500).json({ message: 'Error processing bulk vehicle detection' });
  }
});

// Delete vehicle
router.delete('/:vehicleId', auth, authorize('admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ vehicleId: req.params.vehicleId });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ message: 'Error deleting vehicle' });
  }
});

module.exports = router; 