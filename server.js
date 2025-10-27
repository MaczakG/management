const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Statikus fájlok
app.use(express.static(path.join(__dirname, "frontend")));

// MongoDB
const uri = "mongodb+srv://CMS_BOGRAPHIC:Kiralyok007@mgf.ym6ix.mongodb.net/?retryWrites=true&w=majority&appName=MGF";
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log("MongoDB connected!");
    } catch (err) {
        console.error(err);
    }
}
connectDB();

const database = client.db("MAIN_DATABASE");
const collection = database.collection("Partner_datas");

// API endpoint
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
