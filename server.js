const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const normalizeOrigin = (value) => {
  if (!value) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return trimmed.replace(/\/+$/, '').toLowerCase();
  }
};

const allowedOrigins = new Set(
  [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://doctor-booking-frontend-2.onrender.com',
    process.env.FRONTEND_URL,
  ]
    .flatMap((entry) => (entry ? String(entry).split(',') : []))
    .map(normalizeOrigin)
    .filter(Boolean)
);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS policy does not allow this origin.'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400,
};

// ✅ Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// ✅ Express CORS setup
app.use(cors(corsOptions));

// ✅ Preflight request handle
app.options('*', cors(corsOptions));

app.use(express.json());

// ✅ Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

// ✅ Make io available to routes
app.set('io', io);

app.get('/', (req, res) => {
  res.send('Healthcare API running...');
});

// ✅ Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('send_message', (data) => {
    io.to(data.to).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

let currentPort = Number(process.env.PORT) || 5000;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    const nextPort = currentPort + 1;
    console.warn(`⚠️ Port ${currentPort} is busy. Retrying on port ${nextPort}...`);
    currentPort = nextPort;
    setTimeout(() => {
      server.listen(currentPort);
    }, 300);
    return;
  }

  throw error;
});

server.on('listening', () => {
  console.log(`🚀 Server running on port ${currentPort}`);
});

server.listen(currentPort);
