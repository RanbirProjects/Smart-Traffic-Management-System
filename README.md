🚦 Smart Traffic Management System

A comprehensive real-time traffic management system built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring intelligent signal control, vehicle tracking, emergency management, and advanced analytics.
Dashbord
![344977F6-7A85-4139-BE0A-CB2B93E671A7](https://github.com/user-attachments/assets/835be4d6-d264-4b58-b24a-2c0335dbb5ec)
Traffic signal
![89DD1659-E948-40D5-92FA-A657DF5C2AF8](https://github.com/user-attachments/assets/8adcd9e6-d455-4fc3-9785-7b328eb08ae5)
Vehicle
![7D157934-7027-454F-BEE7-7CFD68CD20B5](https://github.com/user-attachments/assets/2960d3ae-9bb4-42f5-a8ef-4b9645381282)
Analytics
![18EB5BB8-CBAF-407D-85A0-2963968BDEED](https://github.com/user-attachments/assets/093cc2d1-b4ee-4468-8ca4-ba537036f35a)
🌟 Features

🎯 Core Functionality
- Real-time Traffic Signal Control**: Manual and automated signal management
- Vehicle Tracking: Live vehicle detection and monitoring
- Emergency Vehicle Management**: Priority routing for emergency vehicles
- Advanced Analytics: Traffic flow analysis and performance metrics
- Responsive Dashboard: Modern, mobile-friendly interface

🚦 Traffic Signal Management
- Manual signal control (Red/Yellow/Green)
- Real-time traffic flow monitoring
- Signal status tracking (operational/maintenance/malfunction)
- Sensor integration and phase management
- Intersection-specific data

🚗 Vehicle Tracking
- Multi-type vehicle detection (cars, trucks, buses, emergency vehicles)
- Real-time speed and direction monitoring
- License plate recognition
- Lane tracking and congestion analysis
- Emergency vehicle priority routing

 🚨 Emergency Management
- Emergency vehicle detection and tracking
- Automatic signal priority for emergency vehicles
- Emergency alert system
- Response time analytics
- Real-time emergency notifications

 📊 Analytics & Reporting
- Traffic flow trends and patterns
- Congestion analysis and prediction
- Signal performance metrics
- Emergency response statistics
- Real-time system health monitoring

🛠️ Technology Stack

 Frontend
- React.js: Modern UI framework
- CSS3: Advanced styling with glassmorphism effects
- Socket.IO Client: Real-time communication
- Responsive Design: Mobile-first approach

Backend
- Node.js: Server-side runtime
- Express.js: Web application framework
- MongoDB: NoSQL database
- Socket.IO: Real-time bidirectional communication
- JWT: Authentication and authorization

 Development Tools
- Nodemon: Auto-restart server during development
- Concurrently: Run multiple commands simultaneously
- ESLint: Code quality and consistency

🚀 Installation & Setup

 Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

 1. Clone the Repository
```bash
git clone https://github.com/RanbirProjects/Smart-Traffic-Management-System.git
cd Smart-Traffic-Management-System
```

 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

 3. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/traffic-management
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

4. Start the Application
```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
npm run server  # Backend only
npm run client  # Frontend only
```

 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs

📁 Project Structure

```
Smart-Traffic-Management-System/
├── client/                 # React frontend
│   ├── public/
│   │   ├── components/     # React components
│   │   ├── App.js         # Main application
│   │   ├── App.css        # Styles
│   │   └── index.js       # Entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── config/            # Configuration files
│   ├── index.js           # Server entry point
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

 🔌 API Endpoints

Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

Traffic Signals
- `GET /api/signals` - Get all signals
- `POST /api/signals` - Create new signal
- `PUT /api/signals/:id` - Update signal
- `DELETE /api/signals/:id` - Delete signal
- `PUT /api/signals/:id/state` - Change signal state

Vehicles
- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Create vehicle detection
- `PUT /api/vehicles/:id/location` - Update vehicle location
- `PUT /api/vehicles/:id/emergency` - Set emergency status

Emergency Management
- `GET /api/emergency/vehicles` - Get emergency vehicles
- `POST /api/emergency/alert` - Create emergency alert
- `DELETE /api/emergency/alert/:id` - Clear emergency alert
- `GET /api/emergency/stats` - Emergency statistics

Analytics
- `GET /api/analytics/traffic-flow` - Traffic flow data
- `GET /api/analytics/congestion` - Congestion analysis
- `GET /api/analytics/signals` - Signal performance
- `GET /api/analytics/emergency` - Emergency response data

 🎨 UI Components

 Dashboard
- Real-time statistics cards
- Interactive signal controls
- Emergency vehicle monitoring
- Quick action buttons

Traffic Signals
- Signal status cards
- Manual control buttons
- Traffic flow indicators
- Sensor information

Vehicle Tracking
- Vehicle type filtering
- Search functionality
- Detailed vehicle information
- Status indicators

 Analytics
- Interactive charts
- Performance metrics
- Congestion indicators
- Emergency statistics

 🔧 Configuration

Environment Variables
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment mode

 Database Models
- User: Authentication and user management
- TrafficSignal: Signal configuration and status
- Vehicle: Vehicle detection and tracking
- TrafficAnalytics: Analytics and reporting data

 🚀 Deployment

Production Build
```bash
# Build the React app
cd client
npm run build
cd ..

# Start production server
npm start
```

 Docker Deployment
```bash
# Build Docker image
docker build -t traffic-management-system .

# Run container
docker run -p 5000:5000 traffic-management-system
```

 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

👨‍💻 Author

Ranbir Singh
- GitHub: [@RanbirProjects](https://github.com/RanbirProjects)

 🙏 Acknowledgments

- React.js community for the amazing framework
- MongoDB for the robust database solution
- Socket.IO for real-time communication capabilities
- All contributors and supporters of this project

 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: ranbirsingh9156@gmail.com
- Project Link: https://github.com/RanbirProjects/Smart-Traffic-Management-System

---

⭐ Star this repository if you find it helpful!
