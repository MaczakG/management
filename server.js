const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const API_URL = "https://data.mongodb-api.com/app/data-zgugmgou/endpoint/data/v1";
const API_KEY = "6fda53b5-50a3-47b2-a8e2-1efe8d1eba8d";
const DATABASE = "MAIN_DATABASE";
const COLLECTION = "Partner_datas";

// GET /partners
app.get("/partners", async (req, res) => {
  try {
    const { name, completion } = req.query;
    const filters = {};
    if (name) filters.Name = { $regex: name, $options: "i" };
    if (completion) filters.Completion_type = { $regex: completion, $options: "i" };

    const response = await fetch(`${API_URL}/action/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY,
      },
      body: JSON.stringify({
        dataSource: "Cluster0", // vagy a te cluster neved, pl. mgf
        database: DATABASE,
        collection: COLLECTION,
        filter: filters,
      }),
    });

    const data = await response.json();
    res.json(data.documents || []);
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

    const response = await fetch(
      "https://data.mongodb-api.com/app/data-zgugmgou/endpoint/data/v1/action/updateOne",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "6fda53b5-50a3-47b2-a8e2-1efe8d1eba8d"
        },
        body: JSON.stringify({
          dataSource: "mgf",       // a te cluster neved
          database: "MAIN_DATABASE",
          collection: "Partner_datas",
          filter: { ID: data.ID },
          update: { $set: data },
          upsert: true
        })
      }
    );

    const result = await response.json();
    res.json({ success: true, result });

  } catch (err) {
    console.error("Hiba a mentés során:", err);
    res.status(500).json({ error: "Hiba a mentés során" });
  }
});

