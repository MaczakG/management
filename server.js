const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");

// App inicializálása
const app = express();
app.use(cors());
app.use(express.json());

// Statikus fájlok kiszolgálása
app.use(express.static(path.join(__dirname)));

// MongoDB URI (ha később .env-et szeretnél használni, itt cserélheted)
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

// Gyökér útvonal (index.html kiszolgálása)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Szerver indítása
const PORT = 3000;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
