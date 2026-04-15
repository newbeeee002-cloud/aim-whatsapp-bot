const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.get("/", (req, res) => {
  res.send("AIM WhatsApp Bot Running 🚀");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    console.log("Incoming webhook:", JSON.stringify(req.body, null, 2));

    const message =
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body?.trim()?.toLowerCase() || "";

      let replyText = "Hello 👋 Welcome to AIM Tours & Travels!";

      if (text === "hi" || text === "hello") {
        replyText =
          "Hello 👋 Welcome to AIM Tours & Travels!\n\nHow can we help you today?\n1. Flight Ticket\n2. Hotel Booking\n3. Tour Package\n4. Visa Service";
      }

      await axios.post(
        `https://graph.facebook.com/${process.env.GRAPH_VERSION || "v25.0"}/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: replyText }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error(
      "Reply error:",
      error.response?.data || error.message
    );
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
