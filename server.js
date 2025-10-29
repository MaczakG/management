const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");

// Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB
const uri = "mongodb+srv://CMS_BOGRAPHIC:Kiralyok007@mgf.ym6ix.mongodb.net/?retryWrites=true&w=majority&appName=MGF";
const client = new MongoClient(uri);
let collection;

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

// Partners endpoint
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

// index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Node.js HTTP szerver (3000 port)
app.listen(3000, () => {
  console.log("Server running on http://127.0.0.1:3000");
});


// Upsert (hozzáadás/módosítás) végpont
app.post("/partners", async (req, res) => {
  try {
    const data = req.body;

    if (!data.ID) {
      return res.status(400).json({ error: "Az ID mező kötelező!" });
    }

    // Upsert: ha van ilyen ID, frissít; ha nincs, létrehoz
    const result = await collection.updateOne(
      { ID: data.ID },
      { $set: data },
      { upsert: true }
    );

    res.json({ success: true, result });
  } catch (err) {
    console.error("Hiba a mentés során:", err);
    res.status(500).json({ error: "Hiba a mentés során" });
  }
});
