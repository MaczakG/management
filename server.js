import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";

const app = express();
app.use(cors());

const uri = "mongodb+srv://CMS_BOGRAPHIC:Kiralyok007@mgf.ym6ix.mongodb.net/?retryWrites=true&w=majority&appName=MGF";
const client = new MongoClient(uri);

app.get("/api/partners", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("MAIN_DATABASE");
    const collection = db.collection("Partner_datas");

    const name = req.query.name || "";
    const completion = req.query.completion || "";

    const filters = {};
    if (name) filters.Name = { $regex: name, $options: "i" };
    if (completion) filters.Completion_type = { $regex: completion, $options: "i" };

    const docs = await collection.find(filters).toArray();
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
