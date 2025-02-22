// server.js
const express = require('express');
const robot = require('robotjs');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

let mouseControlOn = false;

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // or specify your allowed origin
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    
    next();
});

// Endpoint to receive gaze coordinates and move the mouse pointer
app.post('/move', (req, res) => {
  console.log("req.body", req.body);
  const x = req.body.x;
  const y = req.body.y;
  if (typeof x === 'number' && typeof y === 'number' && mouseControlOn) {
    // Move the mouse pointer to the given screen coordinates
    robot.moveMouse(x, y);
  }
  res.sendStatus(200);
});

app.post('/toggleMouseControl', (req, res) => {
  console.log("req.body", req.body);
  mouseControlOn = req.body.mouseControlOn;
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(port, () => {
  console.log(`Mouse control server is running on http://localhost:${port}`);
});
