const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GRAPH_VERSION = process.env.GRAPH_VERSION || "v25.0";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const OWNER_PHONE = process.env.OWNER_PHONE;

// Simple in-memory session store
const sessions = {};

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

async function sendWhatsAppMessage(to, body) {
  await axios.post(
    `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

function getMenuText() {
  return (
    "Hello 👋 Welcome to AIM Tours & Travels!\n\n" +
    "Please reply with:\n" +
    "1. Flight Ticket\n" +
    "2. Hotel Booking\n" +
    "3. Tour Package\n" +
    "4. Visa Service"
  );
}

function normalizeText(text) {
  return (text || "").trim().toLowerCase();
}

app.post("/webhook", async (req, res) => {
  try {
    console.log("Incoming webhook:", JSON.stringify(req.body, null, 2));

    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = normalizeText(message.text?.body);

    if (!sessions[from]) {
      sessions[from] = {
        stage: "menu",
        service: null
      };
    }

    const session = sessions[from];

    // Reset commands
    if (["menu", "hi", "hello", "hii", "hy", "start"].includes(text)) {
      session.stage = "menu";
      session.service = null;
      await sendWhatsAppMessage(from, getMenuText());
      return res.sendStatus(200);
    }

    // Menu selection
    if (session.stage === "menu") {
      if (text === "1" || text.includes("flight") || text.includes("ticket") || text.includes("tkt")) {
        session.stage = "awaiting_flight_details";
        session.service = "Flight Ticket";

        await sendWhatsAppMessage(
          from,
          "✈️ Flight Ticket Inquiry\nPlease share:\n- From\n- To\n- Travel Date\n- No. of Pax\n- One way / Round trip"
        );
        return res.sendStatus(200);
      }

      if (text === "2" || text.includes("hotel")) {
        session.stage = "awaiting_hotel_details";
        session.service = "Hotel Booking";

        await sendWhatsAppMessage(
          from,
          "🏨 Hotel Booking Inquiry\nPlease share:\n- Destination\n- Check-in Date\n- Check-out Date\n- No. of Guests\n- No. of Rooms"
        );
        return res.sendStatus(200);
      }

      if (text === "3" || text.includes("package") || text.includes("tour")) {
        session.stage = "awaiting_package_details";
        session.service = "Tour Package";

        await sendWhatsAppMessage(
          from,
          "🌍 Tour Package Inquiry\nPlease share:\n- Destination\n- Travel Dates\n- No. of Passengers\n- Budget\n- Hotel category (if any)"
        );
        return res.sendStatus(200);
      }

      if (text === "4" || text.includes("visa")) {
        session.stage = "awaiting_visa_details";
        session.service = "Visa Service";

        await sendWhatsAppMessage(
          from,
          "🛂 Visa Service Inquiry\nPlease share:\n- Country\n- Travel Date\n- No. of Applicants\n- City of residence"
        );
        return res.sendStatus(200);
      }

      await sendWhatsAppMessage(from, getMenuText());
      return res.sendStatus(200);
    }

    // Flight details
    if (session.stage === "awaiting_flight_details") {
      const customerReply =
        "✅ Thank you for sharing your flight inquiry.\n\n" +
        "Received details:\n" +
        `${message.text?.body}\n\n` +
        "Our team will contact you shortly with available options.";

      await sendWhatsAppMessage(from, customerReply);

      if (OWNER_PHONE) {
        const ownerAlert =
          "🚨 New Flight Inquiry\n\n" +
          `Customer No: ${from}\n` +
          `Details: ${message.text?.body}`;
        await sendWhatsAppMessage(OWNER_PHONE, ownerAlert);
      }

      session.stage = "menu";
      session.service = null;
      return res.sendStatus(200);
    }

    // Hotel details
    if (session.stage === "awaiting_hotel_details") {
      const customerReply =
        "✅ Thank you for sharing your hotel inquiry.\n\n" +
        "Received details:\n" +
        `${message.text?.body}\n\n` +
        "Our team will contact you shortly with the best options.";

      await sendWhatsAppMessage(from, customerReply);

      if (OWNER_PHONE) {
        const ownerAlert =
          "🚨 New Hotel Inquiry\n\n" +
          `Customer No: ${from}\n` +
          `Details: ${message.text?.body}`;
        await sendWhatsAppMessage(OWNER_PHONE, ownerAlert);
      }

      session.stage = "menu";
      session.service = null;
      return res.sendStatus(200);
    }

    // Package details
    if (session.stage === "awaiting_package_details") {
      const customerReply =
        "✅ Thank you for sharing your tour package inquiry.\n\n" +
        "Received details:\n" +
        `${message.text?.body}\n\n` +
        "Our team will contact you shortly with suitable package options.";

      await sendWhatsAppMessage(from, customerReply);

      if (OWNER_PHONE) {
        const ownerAlert =
          "🚨 New Tour Package Inquiry\n\n" +
          `Customer No: ${from}\n` +
          `Details: ${message.text?.body}`;
        await sendWhatsAppMessage(OWNER_PHONE, ownerAlert);
      }

      session.stage = "menu";
      session.service = null;
      return res.sendStatus(200);
    }

    // Visa details
    if (session.stage === "awaiting_visa_details") {
      const customerReply =
        "✅ Thank you for sharing your visa inquiry.\n\n" +
        "Received details:\n" +
        `${message.text?.body}\n\n` +
        "Our team will contact you shortly for further assistance.";

      await sendWhatsAppMessage(from, customerReply);

      if (OWNER_PHONE) {
        const ownerAlert =
          "🚨 New Visa Inquiry\n\n" +
          `Customer No: ${from}\n` +
          `Details: ${message.text?.body}`;
        await sendWhatsAppMessage(OWNER_PHONE, ownerAlert);
      }

      session.stage = "menu";
      session.service = null;
      return res.sendStatus(200);
    }

    await sendWhatsAppMessage(from, getMenuText());
    return res.sendStatus(200);
  } catch (error) {
    console.error("Reply error:", error.response?.data || error.message);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
