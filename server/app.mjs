import express from "express";
import http from 'http';
import Redis from "ioredis"
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

app.use(cors()); // needed for socket.io calls to work with CORS
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://chatroom-4o-with-canvas.dev.app.genez.io', //add your frontend url here
    methods: ['GET', 'POST'],
    credentials: true, // we need this to make sure the client connects to the same function when possible
  },
});

// we need redis when sending messages to multiple clients connected to different function instances
const pubClient = new Redis(process.env.UPSTASH_REDIS_URL);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

const rnd = Math.floor(Math.random() * 1000000);
io.engine.use((req, res, next) => {
  console.log(`Instance ID: ${rnd}`);
  res.setHeader("X-Genezio-Instance", rnd);
  next();
});

io.engine.on("headers", (headers, req) => {
  console.log(`Instance ID: ${rnd}`);
  headers["X-Genezio-Instance"] = rnd;
});

// MongoDB connection
mongoose.connect(process.env.CHATROOM_DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const UserSchema = new mongoose.Schema({
  nickname: String,
  socketId: String,
  lastActive: { type: Date, default: Date.now },
});

const MessageSchema = new mongoose.Schema({
  nickname: String,
  content: String,
  timestamp: Date,
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Helper function to auto-disconnect inactive users
const checkInactiveUsers = async () => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const inactiveUsers = await User.find({ lastActive: { $lt: oneMinuteAgo } });
  inactiveUsers.forEach(async (user) => {
    await User.deleteOne({ socketId: user.socketId });
    const message = new Message({ nickname: 'System', content: `${user.nickname} was disconnected due to inactivity`, timestamp: new Date() });
    message.save();
    io.emit('newMessage', message);
    try {
      io.to(user.socketId).disconnectSockets(true);
    } catch (error) {
      console.error(error);
    }
    io.emit('users', await User.find());
  });
};

// Helper function to keep only the last 20 messages
const keepLast20Messages = async () => {
  const messageCount = await Message.countDocuments();
  if (messageCount > 20) {
    const excessMessages = await Message.find().sort({ timestamp: 1 }).limit(messageCount - 20);
    const excessIds = excessMessages.map((msg) => msg._id);
    await Message.deleteMany({ _id: { $in: excessIds } });
  }
};

io.on('connection', (socket) => {
  console.log('user connected');
  
  socket.on('join', async (nickname) => {
    await checkInactiveUsers();
    // check if this nickname is in use
    const existingUser  = await User.findOne({ nickname });
    if (existingUser || nickname === 'System') {
        console.log(`nickname ${nickname} in use`);
        socket.emit('nicknameInUse');
        return;
    }
    console.log(`user ${nickname} joined`);
    const user = new User({ nickname, socketId: socket.id });
    await user.save();
    socket.emit('joined');

    // Emit current users and messages
    const message = new Message({ nickname: 'System', content: `${nickname} joined the chat`, timestamp: new Date() })
    await message.save();
    socket.broadcast.emit('newMessage', message);
    io.emit('users', await User.find());
    socket.emit('messages', await Message.find());
  });

  socket.on('ping', async () => {
    const user = await User.findOne({ socketId: socket.id });
    if (user) {
        await User.updateOne({ socketId: socket.id }, { lastActive: new Date() });
    }
  });

  socket.on('message', async ({ nickname, content }) => {
    await checkInactiveUsers();
    await keepLast20Messages();
    const user = await User.findOne({ nickname });
    if (user) {
        console.log(`new message from ${nickname}`);

        const message = new Message({ nickname, content, timestamp: new Date() });
        message.save();
        await User.updateOne({ nickname }, { socketId: socket.id, lastActive: new Date() });
        io.emit('newMessage', message);
    } else {
        console.log(`user ${nickname} not found`);
        socket.emit('reconnect');
    }
  });

  socket.on('disconnect', async () => {
    const user = await User.findOne({ socketId: socket.id });
    if (!user) return;
    console.log(`user ${user.nickname} disconnected`);
    await User.deleteOne({ socketId: socket.id });
    const message = new Message({ nickname: 'System', content: `${user.nickname} left the chat`, timestamp: new Date() });
    message.save();
    io.emit('newMessage', message);
    io.emit('users', await User.find());
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
