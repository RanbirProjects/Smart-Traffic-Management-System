# 🚀 Deployment Guide

This guide will help you deploy the Smart Traffic Management System to various platforms.

## 📋 Prerequisites

- Node.js (v14 or higher)
- Git
- GitHub account
- Netlify account (for frontend)
- MongoDB Atlas account (for database)

## 🌐 Netlify Deployment (Frontend)

### Option 1: Deploy from GitHub (Recommended)

1. **Fork/Clone the Repository**
   ```bash
   git clone https://github.com/RanbirProjects/Smart-Traffic-Management-System.git
   cd Smart-Traffic-Management-System
   ```

2. **Push to Your GitHub Repository**
   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/Smart-Traffic-Management-System.git
   git push -u origin main
   ```

3. **Deploy to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Configure build settings:
     - **Build command**: `cd client && npm run build`
     - **Publish directory**: `client/build`
   - Click "Deploy site"

### Option 2: Manual Deployment

1. **Build the Application**
   ```bash
   cd client
   npm install
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to Netlify dashboard
   - Drag and drop the `client/build` folder
   - Your site will be deployed automatically

### Netlify Configuration

The project includes these Netlify configuration files:

- `netlify.toml` - Build and redirect configuration
- `public/_redirects` - URL redirects for client-side routing

## 🗄️ MongoDB Atlas Setup (Database)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account

2. **Create a Cluster**
   - Choose "Free" tier
   - Select your preferred region
   - Click "Create"

3. **Configure Database Access**
   - Go to "Database Access"
   - Create a new database user
   - Set username and password

4. **Configure Network Access**
   - Go to "Network Access"
   - Add IP address: `0.0.0.0/0` (allows all IPs)

5. **Get Connection String**
   - Go to "Clusters"
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

## 🔧 Environment Variables

### For Netlify (Frontend)

Add these environment variables in Netlify dashboard:

```
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_SOCKET_URL=https://your-backend-url.com
```

### For Backend (Heroku/Railway/etc.)

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/traffic-management
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
CORS_ORIGIN=https://your-netlify-app.netlify.app
```

## 🚀 Backend Deployment Options

### Option 1: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 2: Railway

1. **Connect GitHub Repository**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub account
   - Select your repository

2. **Configure Environment**
   - Add environment variables
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Deploy**
   - Railway will automatically deploy on push

### Option 3: Render

1. **Create Render Account**
   - Go to [Render](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Connect your repository
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Configure Environment**
   - Add environment variables
   - Deploy

## 🔗 Connecting Frontend to Backend

1. **Update API URL**
   - In your Netlify environment variables, set:
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   ```

2. **Update CORS Settings**
   - In your backend, ensure CORS allows your Netlify domain:
   ```javascript
   app.use(cors({
     origin: process.env.CORS_ORIGIN || 'https://your-app.netlify.app',
     credentials: true
   }));
   ```

## 📱 Custom Domain (Optional)

1. **Add Custom Domain in Netlify**
   - Go to Site settings > Domain management
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**
   - Update `REACT_APP_API_URL` with your custom domain

## 🔍 Troubleshooting

### Common Issues

1. **404 Errors on Netlify**
   - Ensure `_redirects` file is in `public/` folder
   - Check `netlify.toml` configuration

2. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are installed
   - Check for syntax errors

3. **API Connection Issues**
   - Verify CORS settings
   - Check environment variables
   - Ensure backend is running

4. **Database Connection Issues**
   - Verify MongoDB Atlas network access
   - Check connection string format
   - Ensure database user has proper permissions

### Debug Commands

```bash
# Check build locally
npm run build

# Test production build
npm run start

# Check environment variables
echo $REACT_APP_API_URL

# Test API endpoints
curl https://your-backend-url.com/api/health
```

## 📊 Monitoring

### Netlify Analytics
- Enable analytics in Netlify dashboard
- Monitor site performance
- Track user behavior

### Backend Monitoring
- Use platform-specific monitoring tools
- Set up error tracking (Sentry, etc.)
- Monitor API response times

## 🔄 Continuous Deployment

### Automatic Deployments
- Netlify automatically deploys on Git push
- Configure branch-specific deployments
- Set up preview deployments for PRs

### Manual Deployments
```bash
# Trigger manual deployment
git push origin main
```

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review platform-specific documentation
3. Create an issue on GitHub
4. Contact platform support

---

**Happy Deploying! 🚀** 