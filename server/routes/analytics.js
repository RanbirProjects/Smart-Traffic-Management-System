const express = require('express');
const TrafficAnalytics = require('../models/TrafficAnalytics');
const TrafficSignal = require('../models/TrafficSignal');
const Vehicle = require('../models/Vehicle');
const { auth, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Get analytics by signal
router.get('/signal/:signalId', auth, async (req, res) => {
  try {
    const { period = '24h', startDate, endDate } = req.query;
    const { signalId } = req.params;

    let query = { signalId };
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Use period if no specific dates
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
      
      query.timestamp = { $gte: startTime };
    }

    const analytics = await TrafficAnalytics.find(query)
      .sort({ timestamp: 1 });

    res.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

// Get congestion trends
router.get('/congestion/:signalId', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const congestionTrends = await TrafficAnalytics.getCongestionTrends(
      req.params.signalId,
      parseInt(days)
    );

    res.json({ congestionTrends });
  } catch (error) {
    console.error('Get congestion trends error:', error);
    res.status(500).json({ message: 'Error fetching congestion trends' });
  }
});

// Get system-wide analytics
router.get('/system', auth, checkPermission('view_analytics'), async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
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

    // Get system statistics
    const [
      totalSignals,
      operationalSignals,
      totalVehicles,
      emergencyVehicles,
      analyticsData
    ] = await Promise.all([
      TrafficSignal.countDocuments(),
      TrafficSignal.countDocuments({ status: 'operational' }),
      Vehicle.countDocuments({ detectedAt: { $gte: startTime } }),
      Vehicle.countDocuments({ 
        emergencyPriority: true,
        detectedAt: { $gte: startTime }
      }),
      TrafficAnalytics.aggregate([
        {
          $match: { timestamp: { $gte: startTime } }
        },
        {
          $group: {
            _id: null,
            totalVehicles: {
              $sum: {
                $add: [
                  '$trafficFlow.northbound.count',
                  '$trafficFlow.southbound.count',
                  '$trafficFlow.eastbound.count',
                  '$trafficFlow.westbound.count'
                ]
              }
            },
            avgCongestionScore: { $avg: '$congestion.score' },
            totalEmergencyEvents: { $sum: '$emergencyEvents.count' },
            avgWaitTime: { $avg: '$environmental.avgWaitTime' }
          }
        }
      ])
    ]);

    const systemStats = {
      period,
      totalSignals,
      operationalSignals,
      operationalRate: (operationalSignals / totalSignals * 100).toFixed(2),
      totalVehicles,
      emergencyVehicles,
      analytics: analyticsData[0] || {
        totalVehicles: 0,
        avgCongestionScore: 0,
        totalEmergencyEvents: 0,
        avgWaitTime: 0
      }
    };

    res.json({ systemStats });
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({ message: 'Error fetching system analytics' });
  }
});

// Get real-time analytics
router.get('/realtime', auth, async (req, res) => {
  try {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Get real-time data
    const [
      activeSignals,
      recentVehicles,
      emergencyVehicles,
      congestionAlerts
    ] = await Promise.all([
      TrafficSignal.countDocuments({ status: 'operational' }),
      Vehicle.countDocuments({ detectedAt: { $gte: lastHour } }),
      Vehicle.find({ 
        emergencyPriority: true,
        status: 'emergency'
      }).limit(10),
      TrafficAnalytics.find({
        timestamp: { $gte: lastHour },
        'congestion.level': { $in: ['high', 'severe'] }
      }).populate('signalId', 'signalId intersection.name')
    ]);

    const realtimeData = {
      timestamp: now,
      activeSignals,
      recentVehicles,
      emergencyVehicles: emergencyVehicles.length,
      congestionAlerts: congestionAlerts.length,
      alerts: congestionAlerts.map(alert => ({
        signalId: alert.signalId?.signalId,
        intersection: alert.signalId?.intersection?.name,
        congestionLevel: alert.congestion.level,
        score: alert.congestion.score
      }))
    };

    res.json({ realtimeData });
  } catch (error) {
    console.error('Get realtime analytics error:', error);
    res.status(500).json({ message: 'Error fetching real-time analytics' });
  }
});

// Generate analytics report
router.post('/report', auth, checkPermission('view_analytics'), async (req, res) => {
  try {
    const { signalIds, startDate, endDate, reportType } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const startTime = new Date(startDate);
    const endTime = new Date(endDate);

    let query = {
      timestamp: {
        $gte: startTime,
        $lte: endTime
      }
    };

    if (signalIds && signalIds.length > 0) {
      query.signalId = { $in: signalIds };
    }

    const analytics = await TrafficAnalytics.find(query)
      .populate('signalId', 'signalId intersection.name address')
      .sort({ timestamp: 1 });

    // Generate report based on type
    let report;
    switch (reportType) {
      case 'congestion':
        report = generateCongestionReport(analytics);
        break;
      case 'efficiency':
        report = generateEfficiencyReport(analytics);
        break;
      case 'emergency':
        report = generateEmergencyReport(analytics);
        break;
      case 'comprehensive':
        report = generateComprehensiveReport(analytics);
        break;
      default:
        report = generateComprehensiveReport(analytics);
    }

    res.json({
      message: 'Report generated successfully',
      report: {
        type: reportType,
        period: { startDate, endDate },
        generatedAt: new Date(),
        data: report
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Get analytics dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      todayAnalytics,
      weeklyTrends,
      topCongestedSignals,
      emergencyStats
    ] = await Promise.all([
      TrafficAnalytics.aggregate([
        {
          $match: { timestamp: { $gte: last24Hours } }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%H", date: "$timestamp" }
            },
            totalVehicles: {
              $sum: {
                $add: [
                  '$trafficFlow.northbound.count',
                  '$trafficFlow.southbound.count',
                  '$trafficFlow.eastbound.count',
                  '$trafficFlow.westbound.count'
                ]
              }
            },
            avgCongestion: { $avg: '$congestion.score' }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      TrafficAnalytics.aggregate([
        {
          $match: { timestamp: { $gte: last7Days } }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
            },
            totalVehicles: {
              $sum: {
                $add: [
                  '$trafficFlow.northbound.count',
                  '$trafficFlow.southbound.count',
                  '$trafficFlow.eastbound.count',
                  '$trafficFlow.westbound.count'
                ]
              }
            },
            avgCongestion: { $avg: '$congestion.score' }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      TrafficAnalytics.aggregate([
        {
          $match: { 
            timestamp: { $gte: last24Hours },
            'congestion.level': { $in: ['high', 'severe'] }
          }
        },
        {
          $group: {
            _id: '$signalId',
            avgCongestion: { $avg: '$congestion.score' },
            maxCongestion: { $max: '$congestion.score' },
            totalVehicles: {
              $sum: {
                $add: [
                  '$trafficFlow.northbound.count',
                  '$trafficFlow.southbound.count',
                  '$trafficFlow.eastbound.count',
                  '$trafficFlow.westbound.count'
                ]
              }
            }
          }
        },
        { $sort: { avgCongestion: -1 } },
        { $limit: 10 }
      ]),
      TrafficAnalytics.aggregate([
        {
          $match: { timestamp: { $gte: last24Hours } }
        },
        {
          $group: {
            _id: null,
            totalEmergencyEvents: { $sum: '$emergencyEvents.count' },
            avgResponseTime: { $avg: '$emergencyEvents.avgResponseTime' },
            ambulanceCount: { $sum: '$emergencyEvents.types.ambulance' },
            fireTruckCount: { $sum: '$emergencyEvents.types.fire_truck' },
            policeCount: { $sum: '$emergencyEvents.types.police' }
          }
        }
      ])
    ]);

    const dashboardData = {
      todayAnalytics,
      weeklyTrends,
      topCongestedSignals,
      emergencyStats: emergencyStats[0] || {
        totalEmergencyEvents: 0,
        avgResponseTime: 0,
        ambulanceCount: 0,
        fireTruckCount: 0,
        policeCount: 0
      }
    };

    res.json({ dashboardData });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Helper functions for report generation
function generateCongestionReport(analytics) {
  const congestionData = analytics.reduce((acc, record) => {
    const signalId = record.signalId?.signalId || 'Unknown';
    if (!acc[signalId]) {
      acc[signalId] = {
        signalId,
        totalVehicles: 0,
        avgCongestionScore: 0,
        maxCongestionScore: 0,
        severeCongestionCount: 0
      };
    }

    const totalVehicles = record.trafficFlow.northbound.count + 
                         record.trafficFlow.southbound.count + 
                         record.trafficFlow.eastbound.count + 
                         record.trafficFlow.westbound.count;

    acc[signalId].totalVehicles += totalVehicles;
    acc[signalId].avgCongestionScore += record.congestion.score;
    acc[signalId].maxCongestionScore = Math.max(acc[signalId].maxCongestionScore, record.congestion.score);
    
    if (record.congestion.level === 'severe') {
      acc[signalId].severeCongestionCount++;
    }

    return acc;
  }, {});

  // Calculate averages
  Object.values(congestionData).forEach(data => {
    data.avgCongestionScore = data.avgCongestionScore / analytics.length;
  });

  return congestionData;
}

function generateEfficiencyReport(analytics) {
  return analytics.reduce((acc, record) => {
    const signalId = record.signalId?.signalId || 'Unknown';
    if (!acc[signalId]) {
      acc[signalId] = {
        signalId,
        totalCycles: 0,
        avgEfficiency: 0,
        totalGreenTime: 0,
        totalRedTime: 0
      };
    }

    acc[signalId].totalCycles += record.signalPerformance.totalCycles;
    acc[signalId].avgEfficiency += record.signalPerformance.efficiency;
    acc[signalId].totalGreenTime += record.signalPerformance.greenTime;
    acc[signalId].totalRedTime += record.signalPerformance.redTime;

    return acc;
  }, {});
}

function generateEmergencyReport(analytics) {
  return analytics.reduce((acc, record) => {
    const signalId = record.signalId?.signalId || 'Unknown';
    if (!acc[signalId]) {
      acc[signalId] = {
        signalId,
        totalEmergencyEvents: 0,
        avgResponseTime: 0,
        ambulanceCount: 0,
        fireTruckCount: 0,
        policeCount: 0
      };
    }

    acc[signalId].totalEmergencyEvents += record.emergencyEvents.count;
    acc[signalId].avgResponseTime += record.emergencyEvents.avgResponseTime;
    acc[signalId].ambulanceCount += record.emergencyEvents.types.ambulance;
    acc[signalId].fireTruckCount += record.emergencyEvents.types.fire_truck;
    acc[signalId].policeCount += record.emergencyEvents.types.police;

    return acc;
  }, {});
}

function generateComprehensiveReport(analytics) {
  return {
    congestion: generateCongestionReport(analytics),
    efficiency: generateEfficiencyReport(analytics),
    emergency: generateEmergencyReport(analytics),
    summary: {
      totalRecords: analytics.length,
      period: {
        start: analytics[0]?.timestamp,
        end: analytics[analytics.length - 1]?.timestamp
      },
      totalSignals: new Set(analytics.map(a => a.signalId)).size
    }
  };
}

module.exports = router; 