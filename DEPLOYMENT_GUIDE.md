# Deployment Guide for Real-Time TickTock App

## Prerequisites

1. A GitHub repository with your code
2. A MongoDB Atlas account (free tier available)
3. A Render account (free tier available)

## Step 1: Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Get your connection string (it will look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/tictactoe?retryWrites=true&w=majority
   ```

## Step 2: Deploy Server to Render

### 2.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository

### 2.2 Configure Server Settings

- **Name**: `tictactoe-server`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 2.3 Environment Variables

Add these in the Environment tab:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tictactoe?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-client-app.onrender.com
```

### 2.4 Advanced Settings

- **Auto-Deploy**: `Yes`
- **Health Check Path**: `/api/health`

## Step 3: Deploy Client to Render

### 3.1 Create Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect the same repository

### 3.2 Configure Client Settings

- **Name**: `tictactoe-client`
- **Environment**: `Static Site`
- **Branch**: `main`
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `client/build`

### 3.3 Environment Variables

```
REACT_APP_API_URL=https://your-server-name.onrender.com/api
```

## Step 4: Update CORS Settings

After both deployments are complete:

1. Go to your server's settings on Render
2. Update the `CORS_ORIGIN` environment variable to your client's URL:
   ```
   CORS_ORIGIN=https://your-client-app.onrender.com
   ```
3. Redeploy the server

## Step 5: Test Your Deployment

1. Visit your client URL
2. Try creating an account and playing a game
3. Check the server logs in Render dashboard for any errors

## Important Notes

- **Free Tier Limitations**: Render's free tier has limitations:

  - Services sleep after 15 minutes of inactivity
  - Limited build minutes per month
  - Services may take 30+ seconds to wake up

- **Database**: MongoDB Atlas free tier is sufficient for development and small applications

- **Security**: Make sure to use strong, unique JWT secrets in production

- **Monitoring**: Check Render logs regularly for any issues

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure CORS_ORIGIN matches your client URL exactly
2. **Database Connection**: Verify MongoDB URI is correct
3. **Build Failures**: Check that all dependencies are in package.json
4. **Socket.IO Issues**: Ensure both client and server are using compatible versions

### Getting Help:

- Check Render documentation: https://render.com/docs
- Check MongoDB Atlas documentation: https://docs.atlas.mongodb.com/
- Check your application logs in Render dashboard


