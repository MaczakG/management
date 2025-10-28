const https = require("https");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");

// Express app inicializálása
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// SSL tanúsítványok self-signed
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "server.key")),
  cert: fs.readFileSync(path.join(__dirname, "server.cert"))
};

// MongoDB URI és client
const uri = "mongodb+srv://CMS_BOGRAPHIC:Kiralyok007@mgf.ym6ix.mongodb.net/?retryWrites=true&w=majority&appName=MGF";
const client = new MongoClient(uri);
let collection;

// MongoDB csatlakozás
async function connectDB() {
  try {
    await client.connect();
    console.log("MongoDB connected!");
    const database = client.db("MAIN_DATABASE");
    collection = database.collection("Partner_datas");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}
connectDB();

// Health endpoint
app.get("/health", (req, res) => res.status(200).send("OK"));

// API endpoint a partnerek lekéréséhez
app.get("/partners", async (req, res) => {
  try {
    const { name, completion } = req.query;
    const filters = {};
    if (name) filters.Name = { $regex: name, $options: "i" };
    if (completion) filters.Completion_type = { $regex: completion, $options: "i" };

    const documents = await collection.find(filters).toArray();
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Hiba történt a lekérés során" });
  }
});

// index.html kiszolgálása
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// HTTPS szerver indítása 443-on
https.createServer(sslOptions, app).listen(443, () => {
  console.log("HTTPS Server running on port 443");
});
