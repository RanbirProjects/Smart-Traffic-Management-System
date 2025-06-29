import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [trafficSignals, setTrafficSignals] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [emergencyVehicles, setEmergencyVehicles] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [showAddSignal, setShowAddSignal] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    // Simulate real-time data updates
    const mockSignals = [
      {
        signalId: 'TS001',
        location: { coordinates: [-73.935242, 40.730610] },
        currentState: 'green',
        status: 'operational',
        intersection: { name: 'Times Square' },
        trafficFlow: { northbound: 45, southbound: 38, eastbound: 52, westbound: 41 },
        phase: { current: 1, duration: { red: 30, yellow: 5, green: 25 } },
        timing: { lastChange: new Date(), nextChange: new Date(Date.now() + 25000) },
        sensors: [
          { sensorId: 'S001', type: 'vehicle', isActive: true },
          { sensorId: 'S002', type: 'pedestrian', isActive: true }
        ]
      },
      {
        signalId: 'TS002',
        location: { coordinates: [-73.9857, 40.7484] },
        currentState: 'red',
        status: 'operational',
        intersection: { name: 'Madison Square' },
        trafficFlow: { northbound: 32, southbound: 28, eastbound: 35, westbound: 30 },
        phase: { current: 2, duration: { red: 30, yellow: 5, green: 25 } },
        timing: { lastChange: new Date(), nextChange: new Date(Date.now() + 15000) },
        sensors: [
          { sensorId: 'S003', type: 'vehicle', isActive: true }
        ]
      },
      {
        signalId: 'TS003',
        location: { coordinates: [-73.9712, 40.7505] },
        currentState: 'yellow',
        status: 'maintenance',
        intersection: { name: 'Union Square' },
        trafficFlow: { northbound: 55, southbound: 48, eastbound: 62, westbound: 51 },
        phase: { current: 3, duration: { red: 30, yellow: 5, green: 25 } },
        timing: { lastChange: new Date(), nextChange: new Date(Date.now() + 5000) },
        sensors: [
          { sensorId: 'S004', type: 'vehicle', isActive: false },
          { sensorId: 'S005', type: 'emergency', isActive: true }
        ]
      }
    ];

    const mockVehicles = [
      { vehicleId: 'V001', type: 'car', speed: 35, direction: 'north', status: 'moving', licensePlate: 'ABC123', lane: 1 },
      { vehicleId: 'V002', type: 'truck', speed: 25, direction: 'south', status: 'moving', licensePlate: 'XYZ789', lane: 2 },
      { vehicleId: 'V003', type: 'emergency', speed: 45, direction: 'east', status: 'emergency', licensePlate: 'EMG001', lane: 1 },
      { vehicleId: 'V004', type: 'bus', speed: 30, direction: 'west', status: 'moving', licensePlate: 'BUS456', lane: 3 },
      { vehicleId: 'V005', type: 'motorcycle', speed: 40, direction: 'north', status: 'moving', licensePlate: 'MOTO007', lane: 1 },
      { vehicleId: 'V006', type: 'car', speed: 0, direction: 'south', status: 'stopped', licensePlate: 'DEF456', lane: 2 }
    ];

    const mockEmergencyVehicles = [
      { vehicleId: 'V003', type: 'emergency', emergencyType: 'ambulance', speed: 45, direction: 'east', status: 'emergency' }
    ];

    setTrafficSignals(mockSignals);
    setVehicles(mockVehicles);
    setEmergencyVehicles(mockEmergencyVehicles);
    setIsConnected(true);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setTrafficSignals(prev => prev.map(signal => ({
        ...signal,
        trafficFlow: {
          northbound: Math.floor(Math.random() * 60) + 20,
          southbound: Math.floor(Math.random() * 60) + 20,
          eastbound: Math.floor(Math.random() * 60) + 20,
          westbound: Math.floor(Math.random() * 60) + 20
        }
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (state) => {
    switch (state) {
      case 'red': return '#ff4444';
      case 'yellow': return '#ffaa00';
      case 'green': return '#44ff44';
      default: return '#666666';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return '#44ff44';
      case 'maintenance': return '#ffaa00';
      case 'malfunction': return '#ff4444';
      default: return '#666666';
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'car': return '🚗';
      case 'truck': return '🚛';
      case 'bus': return '🚌';
      case 'emergency': return '🚑';
      case 'motorcycle': return '🏍️';
      default: return '🚗';
    }
  };

  const getEmergencyIcon = (type) => {
    switch (type) {
      case 'ambulance': return '🚑';
      case 'fire_truck': return '🚒';
      case 'police': return '🚓';
      default: return '🚑';
    }
  };

  const handleSignalStateChange = (signalId, newState) => {
    setTrafficSignals(prev => prev.map(signal => 
      signal.signalId === signalId 
        ? { ...signal, currentState: newState, timing: { ...signal.timing, lastChange: new Date() } }
        : signal
    ));
  };

  const handleAddSignal = (signalData) => {
    const newSignal = {
      signalId: `TS${String(trafficSignals.length + 1).padStart(3, '0')}`,
      ...signalData,
      currentState: 'red',
      status: 'operational',
      trafficFlow: { northbound: 0, southbound: 0, eastbound: 0, westbound: 0 },
      phase: { current: 1, duration: { red: 30, yellow: 5, green: 25 } },
      timing: { lastChange: new Date(), nextChange: new Date(Date.now() + 30000) },
      sensors: []
    };
    setTrafficSignals(prev => [...prev, newSignal]);
    setShowAddSignal(false);
  };

  const handleEmergencyAlert = (alertData) => {
    const newEmergencyVehicle = {
      vehicleId: `EMG${String(emergencyVehicles.length + 1).padStart(3, '0')}`,
      type: 'emergency',
      emergencyType: alertData.emergencyType,
      speed: 45,
      direction: 'east',
      status: 'emergency',
      licensePlate: `EMG${String(emergencyVehicles.length + 1).padStart(3, '0')}`,
      lane: 1
    };
    setEmergencyVehicles(prev => [...prev, newEmergencyVehicle]);
    setVehicles(prev => [...prev, newEmergencyVehicle]);
    setShowEmergencyAlert(false);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesType = filterType === 'all' || vehicle.type === filterType;
    const matchesSearch = vehicle.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getAnalyticsData = () => {
    const totalVehicles = vehicles.length;
    const emergencyCount = vehicles.filter(v => v.type === 'emergency').length;
    const avgSpeed = vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicles.length;
    const operationalSignals = trafficSignals.filter(s => s.status === 'operational').length;
    
    return {
      totalVehicles,
      emergencyCount,
      avgSpeed: Math.round(avgSpeed),
      operationalSignals,
      totalSignals: trafficSignals.length
    };
  };

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Signals</h3>
          <div className="stat-value">{trafficSignals.filter(s => s.status === 'operational').length}</div>
          <div className="stat-label">Operational</div>
        </div>
        <div className="stat-card">
          <h3>Total Vehicles</h3>
          <div className="stat-value">{vehicles.length}</div>
          <div className="stat-label">Tracked</div>
        </div>
        <div className="stat-card">
          <h3>Emergency Vehicles</h3>
          <div className="stat-value">{emergencyVehicles.length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <h3>System Status</h3>
          <div className="stat-value">🟢</div>
          <div className="stat-label">Healthy</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Traffic Signal Status</h3>
            <button className="btn-secondary" onClick={() => setShowAddSignal(true)}>
              + Add Signal
            </button>
          </div>
          <div className="signals-overview">
            {trafficSignals.map(signal => (
              <div key={signal.signalId} className="signal-item">
                <div className="signal-info">
                  <span className="signal-id">{signal.signalId}</span>
                  <span className="signal-name">{signal.intersection.name}</span>
                </div>
                <div className="signal-controls">
                  <div className="signal-status">
                    <div 
                      className="signal-light" 
                      style={{ backgroundColor: getSignalColor(signal.currentState) }}
                    ></div>
                    <span className="status-text">{signal.currentState.toUpperCase()}</span>
                  </div>
                  <div className="signal-actions">
                    <button 
                      className="btn-small"
                      onClick={() => handleSignalStateChange(signal.signalId, 'red')}
                    >
                      Red
                    </button>
                    <button 
                      className="btn-small"
                      onClick={() => handleSignalStateChange(signal.signalId, 'yellow')}
                    >
                      Yellow
                    </button>
                    <button 
                      className="btn-small"
                      onClick={() => handleSignalStateChange(signal.signalId, 'green')}
                    >
                      Green
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Vehicle Activity</h3>
            <button className="btn-secondary" onClick={() => setShowEmergencyAlert(true)}>
              🚨 Emergency Alert
            </button>
          </div>
          <div className="vehicles-overview">
            {vehicles.slice(0, 5).map(vehicle => (
              <div key={vehicle.vehicleId} className="vehicle-item">
                <span className="vehicle-icon">{getVehicleIcon(vehicle.type)}</span>
                <div className="vehicle-info">
                  <span className="vehicle-id">{vehicle.vehicleId}</span>
                  <span className="vehicle-speed">{vehicle.speed} km/h</span>
                </div>
                <span className="vehicle-direction">{vehicle.direction}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h3>Emergency Vehicles</h3>
        <div className="emergency-grid">
          {emergencyVehicles.map(vehicle => (
            <div key={vehicle.vehicleId} className="emergency-item">
              <span className="emergency-icon">{getEmergencyIcon(vehicle.emergencyType)}</span>
              <div className="emergency-info">
                <span className="emergency-id">{vehicle.vehicleId}</span>
                <span className="emergency-type">{vehicle.emergencyType}</span>
              </div>
              <span className="emergency-speed">{vehicle.speed} km/h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSignals = () => (
    <div className="signals-page">
      <div className="page-header">
        <h2>Traffic Signal Management</h2>
        <button className="btn-primary" onClick={() => setShowAddSignal(true)}>
          + Add New Signal
        </button>
      </div>
      
      <div className="signals-grid">
        {trafficSignals.map(signal => (
          <div key={signal.signalId} className="signal-card">
            <div className="signal-header">
              <h3>{signal.signalId}</h3>
              <span className="signal-location">{signal.intersection.name}</span>
            </div>
            <div className="signal-body">
              <div className="signal-state">
                <div 
                  className="signal-light-large" 
                  style={{ backgroundColor: getSignalColor(signal.currentState) }}
                ></div>
                <span className="state-text">{signal.currentState.toUpperCase()}</span>
              </div>
              
              <div className="signal-controls">
                <h4>Manual Control</h4>
                <div className="control-buttons">
                  <button 
                    className="btn-red"
                    onClick={() => handleSignalStateChange(signal.signalId, 'red')}
                  >
                    RED
                  </button>
                  <button 
                    className="btn-yellow"
                    onClick={() => handleSignalStateChange(signal.signalId, 'yellow')}
                  >
                    YELLOW
                  </button>
                  <button 
                    className="btn-green"
                    onClick={() => handleSignalStateChange(signal.signalId, 'green')}
                  >
                    GREEN
                  </button>
                </div>
              </div>

              <div className="traffic-flow">
                <h4>Traffic Flow</h4>
                <div className="flow-directions">
                  <div className="flow-item">
                    <span>North: {signal.trafficFlow.northbound}</span>
                  </div>
                  <div className="flow-item">
                    <span>South: {signal.trafficFlow.southbound}</span>
                  </div>
                  <div className="flow-item">
                    <span>East: {signal.trafficFlow.eastbound}</span>
                  </div>
                  <div className="flow-item">
                    <span>West: {signal.trafficFlow.westbound}</span>
                  </div>
                </div>
              </div>

              <div className="signal-details">
                <div className="detail-row">
                  <span>Status:</span>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(signal.status) }}
                  >
                    {signal.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Sensors:</span>
                  <span>{signal.sensors.length} active</span>
                </div>
                <div className="detail-row">
                  <span>Phase:</span>
                  <span>{signal.phase.current}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVehicles = () => (
    <div className="vehicles-page">
      <div className="page-header">
        <h2>Vehicle Tracking</h2>
        <div className="filters">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="car">Cars</option>
            <option value="truck">Trucks</option>
            <option value="bus">Buses</option>
            <option value="emergency">Emergency</option>
            <option value="motorcycle">Motorcycles</option>
          </select>
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="vehicles-grid">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.vehicleId} className="vehicle-card">
            <div className="vehicle-header">
              <span className="vehicle-icon-large">{getVehicleIcon(vehicle.type)}</span>
              <span className="vehicle-id-large">{vehicle.vehicleId}</span>
            </div>
            <div className="vehicle-details">
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{vehicle.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">License:</span>
                <span className="detail-value">{vehicle.licensePlate || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Speed:</span>
                <span className="detail-value">{vehicle.speed} km/h</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Direction:</span>
                <span className="detail-value">{vehicle.direction}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Lane:</span>
                <span className="detail-value">{vehicle.lane}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status-${vehicle.status}`}>
                  {vehicle.status}
                </span>
              </div>
              {vehicle.type === 'emergency' && (
                <div className="detail-item">
                  <span className="detail-label">Emergency Type:</span>
                  <span className="detail-value">{vehicle.emergencyType}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => {
    const analyticsData = getAnalyticsData();
    
    return (
      <div className="analytics-page">
        <h2>Traffic Analytics</h2>
        
        <div className="analytics-overview">
          <div className="analytics-card">
            <h3>System Overview</h3>
            <div className="analytics-stats">
              <div className="analytics-stat">
                <span className="stat-number">{analyticsData.totalVehicles}</span>
                <span className="stat-label">Total Vehicles</span>
              </div>
              <div className="analytics-stat">
                <span className="stat-number">{analyticsData.emergencyCount}</span>
                <span className="stat-label">Emergency Vehicles</span>
              </div>
              <div className="analytics-stat">
                <span className="stat-number">{analyticsData.avgSpeed}</span>
                <span className="stat-label">Avg Speed (km/h)</span>
              </div>
              <div className="analytics-stat">
                <span className="stat-number">{analyticsData.operationalSignals}/{analyticsData.totalSignals}</span>
                <span className="stat-label">Operational Signals</span>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Traffic Flow Trends</h3>
            <div className="chart-container">
              <div className="chart-placeholder">
                📊 Traffic flow chart will be displayed here
                <div className="chart-mock">
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                  <div className="chart-bar" style={{ height: '40%' }}></div>
                  <div className="chart-bar" style={{ height: '90%' }}></div>
                  <div className="chart-bar" style={{ height: '70%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="analytics-card">
            <h3>Congestion Analysis</h3>
            <div className="chart-container">
              <div className="chart-placeholder">
                📈 Congestion trends will be displayed here
                <div className="congestion-indicators">
                  <div className="congestion-level low">Low</div>
                  <div className="congestion-level medium">Medium</div>
                  <div className="congestion-level high">High</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="analytics-card">
            <h3>Signal Performance</h3>
            <div className="chart-container">
              <div className="chart-placeholder">
                ⏱️ Signal efficiency metrics will be displayed here
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="metric-value">85%</span>
                    <span className="metric-label">Efficiency</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">2.3s</span>
                    <span className="metric-label">Avg Wait Time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="analytics-card">
            <h3>Emergency Response</h3>
            <div className="chart-container">
              <div className="chart-placeholder">
                🚑 Emergency vehicle response times will be displayed here
                <div className="emergency-stats">
                  <div className="emergency-stat">
                    <span className="stat-value">3.2s</span>
                    <span className="stat-label">Avg Response</span>
                  </div>
                  <div className="emergency-stat">
                    <span className="stat-value">12</span>
                    <span className="stat-label">Today's Alerts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal components
  const AddSignalModal = () => (
    <div className="modal-overlay" onClick={() => setShowAddSignal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add New Traffic Signal</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleAddSignal({
            intersection: { name: formData.get('intersection') },
            location: { coordinates: [parseFloat(formData.get('longitude')), parseFloat(formData.get('latitude'))] }
          });
        }}>
          <div className="form-group">
            <label>Intersection Name:</label>
            <input type="text" name="intersection" required />
          </div>
          <div className="form-group">
            <label>Longitude:</label>
            <input type="number" step="any" name="longitude" required />
          </div>
          <div className="form-group">
            <label>Latitude:</label>
            <input type="number" step="any" name="latitude" required />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowAddSignal(false)}>Cancel</button>
            <button type="submit">Add Signal</button>
          </div>
        </form>
      </div>
    </div>
  );

  const EmergencyAlertModal = () => (
    <div className="modal-overlay" onClick={() => setShowEmergencyAlert(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Create Emergency Alert</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleEmergencyAlert({
            emergencyType: formData.get('emergencyType'),
            description: formData.get('description')
          });
        }}>
          <div className="form-group">
            <label>Emergency Type:</label>
            <select name="emergencyType" required>
              <option value="ambulance">Ambulance</option>
              <option value="fire_truck">Fire Truck</option>
              <option value="police">Police</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea name="description" required></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowEmergencyAlert(false)}>Cancel</button>
            <button type="submit">Create Alert</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🚦 Smart Traffic Management System</h1>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`nav-button ${activeTab === 'signals' ? 'active' : ''}`}
          onClick={() => setActiveTab('signals')}
        >
          🚦 Traffic Signals
        </button>
        <button 
          className={`nav-button ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicles')}
        >
          🚗 Vehicles
        </button>
        <button 
          className={`nav-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'signals' && renderSignals()}
        {activeTab === 'vehicles' && renderVehicles()}
        {activeTab === 'analytics' && renderAnalytics()}
      </main>

      {showAddSignal && <AddSignalModal />}
      {showEmergencyAlert && <EmergencyAlertModal />}
    </div>
  );
}

export default App;
