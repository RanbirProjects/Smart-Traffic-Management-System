const mongoose = require('mongoose');

const trafficSignalSchema = new mongoose.Schema({
  signalId: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  intersection: {
    name: String,
    description: String
  },
  currentState: {
    type: String,
    enum: ['red', 'yellow', 'green', 'off', 'emergency'],
    default: 'red'
  },
  phase: {
    current: {
      type: Number,
      default: 1
    },
    duration: {
      red: { type: Number, default: 30 },
      yellow: { type: Number, default: 5 },
      green: { type: Number, default: 25 }
    },
    sequence: [{
      phase: Number,
      duration: Number,
      signals: [{
        direction: String,
        state: String
      }]
    }]
  },
  timing: {
    lastChange: {
      type: Date,
      default: Date.now
    },
    nextChange: {
      type: Date
    },
    cycleLength: {
      type: Number,
      default: 60
    }
  },
  sensors: [{
    sensorId: String,
    type: {
      type: String,
      enum: ['vehicle', 'pedestrian', 'emergency'],
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastReading: {
      type: Date
    }
  }],
  trafficFlow: {
    northbound: { type: Number, default: 0 },
    southbound: { type: Number, default: 0 },
    eastbound: { type: Number, default: 0 },
    westbound: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'malfunction', 'offline'],
    default: 'operational'
  },
  maintenance: {
    lastMaintenance: Date,
    nextMaintenance: Date,
    issues: [{
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
      },
      reportedAt: {
        type: Date,
        default: Date.now
      },
      resolvedAt: Date
    }]
  },
  emergencyPriority: {
    type: Boolean,
    default: false
  },
  emergencyVehicles: [{
    vehicleId: String,
    priority: Number,
    estimatedArrival: Date
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
trafficSignalSchema.index({ location: '2dsphere' });

// Index for signal ID queries
trafficSignalSchema.index({ signalId: 1 });

// Method to update signal state
trafficSignalSchema.methods.updateState = function(newState, duration = null) {
  this.currentState = newState;
  this.timing.lastChange = new Date();
  
  if (duration) {
    this.timing.nextChange = new Date(Date.now() + duration * 1000);
  }
  
  return this.save();
};

// Method to add emergency vehicle
trafficSignalSchema.methods.addEmergencyVehicle = function(vehicleData) {
  this.emergencyVehicles.push(vehicleData);
  this.emergencyPriority = true;
  return this.save();
};

// Method to remove emergency vehicle
trafficSignalSchema.methods.removeEmergencyVehicle = function(vehicleId) {
  this.emergencyVehicles = this.emergencyVehicles.filter(v => v.vehicleId !== vehicleId);
  if (this.emergencyVehicles.length === 0) {
    this.emergencyPriority = false;
  }
  return this.save();
};

// Static method to find signals by location
trafficSignalSchema.statics.findNearby = function(coordinates, maxDistance = 1000) {
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

module.exports = mongoose.model('TrafficSignal', trafficSignalSchema); 