const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['car', 'truck', 'bus', 'motorcycle', 'emergency', 'public_transport'],
    required: true
  },
  licensePlate: {
    type: String,
    trim: true
  },
  emergencyPriority: {
    type: Boolean,
    default: false
  },
  emergencyType: {
    type: String,
    enum: ['ambulance', 'fire_truck', 'police', 'none'],
    default: 'none'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  speed: {
    type: Number,
    min: 0,
    max: 200
  },
  direction: {
    type: String,
    enum: ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'],
    required: true
  },
  status: {
    type: String,
    enum: ['moving', 'stopped', 'parked', 'emergency'],
    default: 'moving'
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  signalId: {
    type: String,
    ref: 'TrafficSignal'
  },
  lane: {
    type: Number,
    min: 1,
    max: 8
  },
  estimatedArrival: {
    type: Date
  },
  route: [{
    signalId: String,
    estimatedTime: Date,
    actualTime: Date
  }],
  sensorData: [{
    sensorId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    speed: Number,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    }
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
vehicleSchema.index({ location: '2dsphere' });

// Index for vehicle tracking
vehicleSchema.index({ vehicleId: 1, detectedAt: -1 });

// Index for emergency vehicles
vehicleSchema.index({ emergencyPriority: 1, emergencyType: 1 });

// Method to update vehicle location
vehicleSchema.methods.updateLocation = function(newLocation, speed = null) {
  this.location = newLocation;
  if (speed !== null) {
    this.speed = speed;
  }
  this.detectedAt = new Date();
  
  // Add to sensor data
  this.sensorData.push({
    sensorId: 'GPS',
    timestamp: new Date(),
    speed: this.speed,
    location: newLocation
  });
  
  return this.save();
};

// Method to set emergency status
vehicleSchema.methods.setEmergencyStatus = function(emergencyType) {
  this.emergencyPriority = true;
  this.emergencyType = emergencyType;
  this.status = 'emergency';
  return this.save();
};

// Method to clear emergency status
vehicleSchema.methods.clearEmergencyStatus = function() {
  this.emergencyPriority = false;
  this.emergencyType = 'none';
  this.status = 'moving';
  return this.save();
};

// Static method to find vehicles by location
vehicleSchema.statics.findNearby = function(coordinates, maxDistance = 1000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Static method to find emergency vehicles
vehicleSchema.statics.findEmergencyVehicles = function() {
  return this.find({
    emergencyPriority: true,
    status: 'emergency'
  });
};

// Static method to get traffic flow statistics
vehicleSchema.statics.getTrafficFlow = function(signalId, timeRange = 3600000) { // 1 hour default
  const startTime = new Date(Date.now() - timeRange);
  
  return this.aggregate([
    {
      $match: {
        signalId: signalId,
        detectedAt: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: {
          direction: '$direction',
          type: '$type'
        },
        count: { $sum: 1 },
        avgSpeed: { $avg: '$speed' }
      }
    }
  ]);
};

module.exports = mongoose.model('Vehicle', vehicleSchema); 