const express = require("express");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Home route
app.get("/", (req, res) => {
  res.send("AIM WhatsApp Bot Running 🚀");
});

// 🔥 Webhook verification (IMPORTANT)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
});

// 🔥 Receive messages
app.post("/webhook", (req, res) => {
  console.log("Incoming message:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// Port fix for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
