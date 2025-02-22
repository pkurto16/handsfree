// mouseServer.js
const express = require('express');
const cors = require('cors');
const robot = require('robotjs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.post('/move', (req, res) => {
  try {
    const { x, y } = req.body;

    // Get screen size
    const screen = robot.getScreenSize();

    // Ensure coordinates are within bounds
    const boundedX = Math.max(0, Math.min(Math.round(x), screen.width));
    const boundedY = Math.max(0, Math.min(Math.round(y), screen.height));

    // Move mouse
    robot.moveMouse(boundedX, boundedY);

    res.json({ success: true, coordinates: { x: boundedX, y: boundedY } });
  } catch (error) {
    console.error('Error moving mouse:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Mouse control server running on port ${PORT}`);
});