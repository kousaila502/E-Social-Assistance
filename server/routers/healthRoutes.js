// routers/healthRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

const healthCheck = async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get system info
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'unknown'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      services: {
        authentication: 'operational',
        notifications: 'operational',
        fileUpload: 'operational'
      }
    };

    // If database is disconnected, mark as unhealthy
    if (dbStatus === 'disconnected') {
      healthInfo.status = 'unhealthy';
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json(healthInfo);
    }

    res.status(StatusCodes.OK).json(healthInfo);
  } catch (error) {
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Simple ping endpoint
const ping = (req, res) => {
  res.status(StatusCodes.OK).json({
    message: 'pong',
    timestamp: new Date().toISOString()
  });
};

router.get('/health', healthCheck);
router.get('/ping', ping);

module.exports = router;