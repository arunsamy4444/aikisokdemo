
const express = require('express'); 
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'https://aikisokdemo.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'https://aikisokdemo.onrender.com',
    credentials: true,
  })
);



// MongoDB Schema Definitions
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const connectionSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  roomId: String,
});

const User = mongoose.model('User', userSchema);
const Connection = mongoose.model('Connection', connectionSchema);

// MongoDB connection
mongoose
  .connect('mongodb+srv://arunsamy4444:1234567890@cluster0.o981j.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// API Routes
// User Signup
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).send({ error: 'User already exists' });
  }

  const user = new User({ email, password });
  await user.save();
  res.status(201).send({ message: 'User registered successfully' });
});

// User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).send({ error: 'Invalid credentials' });
  }

  if (user.password === password) {
    res.send({ userId: user._id, message: 'Login successful' });
  } else {
    res.status(401).send({ error: 'Invalid credentials' });
  }
});

// Get all users (no authentication needed)
app.get('/api/users', async (req, res) => {
  const users = await User.find(); // Fetching all users
  res.send(users);
});

// Send friend request
app.post('/api/send-request', async (req, res) => {
  const { recipientId, userId } = req.body; // Assume userId is passed
  const existingConnection = await Connection.findOne({
    $or: [
      { requester: userId, recipient: recipientId },
      { requester: recipientId, recipient: userId }
    ]
  });

  if (existingConnection) {
    return res.status(400).send({ error: 'Connection already exists' });
  }

  const connection = new Connection({
    requester: userId,
    recipient: recipientId,
    status: 'pending',
  });
  await connection.save();
  res.send({ message: 'Friend request sent' });
});


app.post('/api/accept-request', async (req, res) => {
  const { requestId } = req.body;
  const roomId = uuidv4(); // Generate unique room ID for the video call

  try {
    const connection = await Connection.findByIdAndUpdate(
      requestId,
      { status: 'accepted', roomId },
      { new: true } // Return the updated document
    );

    if (!connection) {
      return res.status(404).send({ error: 'Request not found' });
    }

    res.send({ message: 'Friend request accepted', roomId, connection });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});
// WebSocket event handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', data.offer);
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', data.answer);
  });

  socket.on('candidate', (data) => {
    socket.to(data.roomId).emit('candidate', data.candidate);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});









// const express = require('express');
// const http = require('http');
// const path = require('path');
// const { Server } = require('socket.io');
// const mongoose = require('mongoose');
// const { v4: uuidv4 } = require('uuid');
// const cors = require('cors');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: 'http://localhost:3001', // Frontend URL
//     methods: ['GET', 'POST'],
//     credentials: true,
//   },
// });

// // Middleware
// app.use(express.json());
// app.use(cors({
//   origin: 'http://localhost:3001',
//   credentials: true,
// }));

// // MongoDB Schema Definitions
// const userSchema = new mongoose.Schema({
//   email: String,
//   password: String, // Storing password in plain text for now, NOT recommended in production
// });

// const connectionSchema = new mongoose.Schema({
//   requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
//   roomId: String,
// });

// const User = mongoose.model('User', userSchema);
// const Connection = mongoose.model('Connection', connectionSchema);

// // MongoDB connection
// mongoose
//   .connect('mongodb+srv://arunsamy4444:1234567890@cluster0.o981j.mongodb.net/?retryWrites=true&w=majority', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => console.error('MongoDB connection error:', err));

// // API Routes
// // User Signup
// app.post('/api/signup', async (req, res) => {
//   const { email, password } = req.body;
//   const existingUser = await User.findOne({ email });

//   if (existingUser) {
//     return res.status(400).send({ error: 'User already exists' });
//   }

//   const user = new User({ email, password });
//   await user.save();
//   res.status(201).send({ message: 'User registered successfully' });
// });

// // User Login
// app.post('/api/login', async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (!user) {
//     return res.status(401).send({ error: 'Invalid credentials' });
//   }

//   // Simple password comparison (plain text)
//   if (user.password === password) {
//     res.send({ userId: user._id, message: 'Login successful' });
//   } else {
//     res.status(401).send({ error: 'Invalid credentials' });
//   }
// });


// // Get all users (no authentication needed)
// app.get('/api/users', async (req, res) => {
//   const users = await User.find(); // Fetching all users
//   res.send(users);
// });

// // Send friend request
// app.post('/api/send-request', async (req, res) => {
//   const { recipientId, userId } = req.body; // Assume userId is passed
//   const existingConnection = await Connection.findOne({
//     $or: [
//       { requester: userId, recipient: recipientId },
//       { requester: recipientId, recipient: userId }
//     ]
//   });

//   if (existingConnection) {
//     return res.status(400).send({ error: 'Connection already exists' });
//   }

//   const connection = new Connection({
//     requester: userId,
//     recipient: recipientId,
//     status: 'pending',
//   });
//   await connection.save();
//   res.send({ message: 'Friend request sent' });
// });

// // Accept friend request
// app.post('/api/accept-request', async (req, res) => {
//   const { requestId } = req.body;
//   const roomId = uuidv4(); // Generate unique room ID for the video call
//   const connection = await Connection.findByIdAndUpdate(requestId, {
//     status: 'accepted',
//     roomId,
//   });
//   res.send({ message: 'Friend request accepted', roomId });
// });

// // WebSocket event handling
// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);

//   socket.on('join-room', (roomId) => {
//     socket.join(roomId);
//     socket.to(roomId).emit('user-joined', socket.id);
//   });

//   socket.on('offer', (data) => {
//     socket.to(data.roomId).emit('offer', data.offer);
//   });

//   socket.on('answer', (data) => {
//     socket.to(data.roomId).emit('answer', data.answer);
//   });

//   socket.on('candidate', (data) => {
//     socket.to(data.roomId).emit('candidate', data.candidate);
//   });

//   socket.on('disconnect', () => {
//     console.log('A user disconnected:', socket.id);
//   });
// });

// // Serve React Frontend
// app.use(express.static(path.join(__dirname, 'build')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

// // Start Server
// server.listen(3000, () => {
//   console.log('Server running on http://localhost:3000');
// });
