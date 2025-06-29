const mongoose = require('mongoose');

const trafficAnalyticsSchema = new mongoose.Schema({
  signalId: {
    type: String,
    ref: 'TrafficSignal',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    required: true
  },
  trafficFlow: {
    northbound: {
      count: { type: Number, default: 0 },
      avgSpeed: { type: Number, default: 0 },
      maxSpeed: { type: Number, default: 0 },
      minSpeed: { type: Number, default: 0 }
    },
    southbound: {
      count: { type: Number, default: 0 },
      avgSpeed: { type: Number, default: 0 },
      maxSpeed: { type: Number, default: 0 },
      minSpeed: { type: Number, default: 0 }
    },
    eastbound: {
      count: { type: Number, default: 0 },
      avgSpeed: { type: Number, default: 0 },
      maxSpeed: { type: Number, default: 0 },
      minSpeed: { type: Number, default: 0 }
    },
    westbound: {
      count: { type: Number, default: 0 },
      avgSpeed: { type: Number, default: 0 },
      maxSpeed: { type: Number, default: 0 },
      minSpeed: { type: Number, default: 0 }
    }
  },
  vehicleTypes: {
    car: { type: Number, default: 0 },
    truck: { type: Number, default: 0 },
    bus: { type: Number, default: 0 },
    motorcycle: { type: Number, default: 0 },
    emergency: { type: Number, default: 0 },
    public_transport: { type: Number, default: 0 }
  },
  signalPerformance: {
    totalCycles: { type: Number, default: 0 },
    avgCycleTime: { type: Number, default: 0 },
    redTime: { type: Number, default: 0 },
    greenTime: { type: Number, default: 0 },
    yellowTime: { type: Number, default: 0 },
    efficiency: { type: Number, default: 0 } // percentage
  },
  congestion: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'severe'],
      default: 'low'
    },
    score: { type: Number, default: 0 }, // 0-100
    duration: { type: Number, default: 0 } // minutes
  },
  emergencyEvents: {
    count: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    types: {
      ambulance: { type: Number, default: 0 },
      fire_truck: { type: Number, default: 0 },
      police: { type: Number, default: 0 }
    }
  },
  environmental: {
    avgWaitTime: { type: Number, default: 0 },
    totalEmissions: { type: Number, default: 0 }, // CO2 equivalent
    fuelConsumption: { type: Number, default: 0 } // liters
  },
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number,
    visibility: Number
  },
  events: [{
    type: {
      type: String,
      enum: ['accident', 'construction', 'event', 'weather', 'maintenance'],
      required: true
    },
    description: String,
    impact: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    startTime: Date,
    endTime: Date
  }],
  recommendations: [{
    type: {
      type: String,
      enum: ['timing_adjustment', 'phase_optimization', 'maintenance', 'infrastructure'],
      required: true
    },
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    estimatedImpact: String,
    implementationCost: String
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
trafficAnalyticsSchema.index({ signalId: 1, timestamp: -1 });
trafficAnalyticsSchema.index({ period: 1, timestamp: -1 });
trafficAnalyticsSchema.index({ 'congestion.level': 1, timestamp: -1 });

// Method to calculate congestion level
trafficAnalyticsSchema.methods.calculateCongestionLevel = function() {
  const totalFlow = this.trafficFlow.northbound.count + 
                   this.trafficFlow.southbound.count + 
                   this.trafficFlow.eastbound.count + 
                   this.trafficFlow.westbound.count;
  
  const avgSpeed = (this.trafficFlow.northbound.avgSpeed + 
                   this.trafficFlow.southbound.avgSpeed + 
                   this.trafficFlow.eastbound.avgSpeed + 
                   this.trafficFlow.westbound.avgSpeed) / 4;
  
  let level = 'low';
  let score = 0;
  
  if (totalFlow > 1000 && avgSpeed < 20) {
    level = 'severe';
    score = 90;
  } else if (totalFlow > 500 && avgSpeed < 30) {
    level = 'high';
    score = 70;
  } else if (totalFlow > 200 && avgSpeed < 40) {
    level = 'medium';
    score = 50;
  } else {
    level = 'low';
    score = 20;
  }
  
  this.congestion.level = level;
  this.congestion.score = score;
  
  return this.save();
};

// Method to calculate signal efficiency
trafficAnalyticsSchema.methods.calculateEfficiency = function() {
  const totalTime = this.signalPerformance.redTime + 
                   this.signalPerformance.greenTime + 
                   this.signalPerformance.yellowTime;
  
  if (totalTime > 0) {
    this.signalPerformance.efficiency = (this.signalPerformance.greenTime / totalTime) * 100;
  }
  
  return this.save();
};

// Static method to get analytics by time range
trafficAnalyticsSchema.statics.getAnalyticsByTimeRange = function(signalId, startTime, endTime) {
  return this.find({
    signalId: signalId,
    timestamp: {
      $gte: startTime,
      $lte: endTime
    }
  }).sort({ timestamp: 1 });
};

// Static method to get congestion trends
trafficAnalyticsSchema.statics.getCongestionTrends = function(signalId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        signalId: signalId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
        },
        avgCongestionScore: { $avg: "$congestion.score" },
        maxCongestionScore: { $max: "$congestion.score" },
        totalVehicles: {
          $sum: {
            $add: [
              "$trafficFlow.northbound.count",
              "$trafficFlow.southbound.count",
              "$trafficFlow.eastbound.count",
              "$trafficFlow.westbound.count"
            ]
          }
        }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);
};

module.exports = mongoose.model('TrafficAnalytics', trafficAnalyticsSchema); 