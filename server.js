const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // hogy a HTML/JS fájlok elérhetők legyenek

const client = new MongoClient("mongodb+srv://CMS_BOGRAPHIC:Kiralyok007@mgf.ym6ix.mongodb.net/?retryWrites=true&w=majority");
let collection;

async function connectDB() {
  await client.connect();
  const database = client.db("MAIN_DATABASE");
  collection = database.collection("Partner_datas"); // ✅ itt a kollekció neve
  console.log("MongoDB connected!");
}
connectDB();

// GET /partners
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

// POST /partners
app.post("/partners", async (req, res) => {
  try {
    const data = req.body;
    if (!data.ID) return res.status(400).json({ error: "Az ID mező kötelező!" });

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

// index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(3000, () => console.log("Server running on http://127.0.0.1:3000"));
