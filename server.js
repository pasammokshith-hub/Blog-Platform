const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blogplatform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Schemas
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    date: { type: Date, default: Date.now }
  }]
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

// Routes

// Register
app.post('/users/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash });
  await user.save();
  res.json({ message: 'User registered', userId: user._id });
});

// Login
app.post('/users/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Incorrect password' });
  res.json({ message: 'Login successful', userId: user._id });
});

// Create post
app.post('/posts', async (req, res) => {
  const { title, content, author } = req.body;
  const post = new Post({ title, content, author });
  await post.save();
  res.json(post);
});

// Get all posts
app.get('/posts', async (req, res) => {
  const posts = await Post.find().populate('author', 'username').populate('comments.user', 'username');
  res.json(posts);
});

// Add comment
app.post('/posts/:id/comments', async (req, res) => {
  const { userId, text } = req.body;
  const post = await Post.findById(req.params.id);
  post.comments.push({ user: userId, text });
  await post.save();
  const populatedPost = await Post.findById(req.params.id).populate('comments.user', 'username');
  res.json(populatedPost);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
