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

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");

    // Keressük meg az aktuálisan aktív tartalmat
    var activeTab = null;
    for (i = 0; i < tabcontent.length; i++) {
        if (tabcontent[i].classList.contains("active")) {
            activeTab = tabcontent[i];
            break;
        }
    }

    // Ha van aktív fül, csúsztassuk ki
    if (activeTab) {
    activeTab.classList.add("exiting");
    activeTab.classList.remove("active");
    setTimeout(function() {
        activeTab.classList.remove("exiting");
        activeTab.style.display = "none";
    }, 500);
}


    // Törölje az "active" osztályt a gombokról
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Késleltessük az új tab tartalom becsúszását, miután a régi kicsúszott
    setTimeout(function() {
        var currentTab = document.getElementById(tabName);
        currentTab.style.display = "block";
        setTimeout(function() {
            currentTab.classList.add("active");
        }, 10);  // Kis késleltetés az animáció indításához
    }, 500);  // Várjuk meg, amíg az előző tartalom teljesen eltűnik

    // Az aktuális gomb "active" osztály hozzáadása
    evt.currentTarget.className += " active";
}






async function loadData() {
    const name = document.getElementById("nameFilter").value;
    const completion = document.getElementById("completionFilter").value;

    const url = new URL("https://13.60.229.11/partners"); // <-- cseréld a saját publikus IP-re
    if (name) url.searchParams.append("name", name);
    if (completion) url.searchParams.append("completion", completion);

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Hálózati hiba: " + res.status);

        const data = await res.json();
        const tbody = document.querySelector("#partnersTable tbody");
        tbody.innerHTML = "";

        data.forEach(doc => {
            const row = document.createElement("tr");

            // 1. Szerkesztés oszlop
            const editTd = document.createElement("td");
            const img = document.createElement("img");
            img.src = "note.png";
            img.alt = "Edit";
            img.classList.add("edit-icon");
            img.style.cursor = "pointer";

            // Click esemény: betölti a form mezőit
            img.addEventListener("click", () => {
                document.querySelector('input[placeholder="ID"]').value = doc.ID || "";
                document.querySelector('input[placeholder="TaskID"]').value = doc.TaskID || "";
                document.querySelector('input[placeholder="Name"]').value = doc.Name || "";
                document.querySelector('input[placeholder="Partner_type"]').value = doc.Partner_type || "";
                document.querySelector('input[placeholder="Completion_type"]').value = doc.Completion_type || "";
                document.querySelector('input[placeholder="Finance_type"]').value = doc.Finance_type || "";
                document.querySelector('input[placeholder="Country"]').value = doc.Country || "";
                document.querySelector('input[placeholder="Zip"]').value = doc.Zip || "";
                document.querySelector('input[placeholder="City"]').value = doc.City || "";
                document.querySelector('input[placeholder="Street"]').value = doc.Street || "";
                document.querySelector('input[placeholder="Email"]').value = doc.Email || "";
                document.querySelector('input[placeholder="Reg_number"]').value = doc.Reg_number || "";
                document.querySelector('input[placeholder="Vat"]').value = doc.Vat || "";
                document.querySelector('input[placeholder="EU_vat"]').value = doc.EU_vat || "";
                document.querySelector('input[placeholder="Bank"]').value = doc.Bank || "";
                document.querySelector('input[placeholder="Invoice_type"]').value = doc.Invoice_type || "";
                document.querySelector('input[placeholder="Currency"]').value = doc.Currency || "";
                document.querySelector('input[placeholder="Language"]').value = doc.Language || "";
                document.querySelector('input[placeholder="Day"]').value = doc.Day || "";
            });

            editTd.appendChild(img);
            row.appendChild(editTd);

            // 2. További oszlopok
            const columns = ["ID","Name","Partner_type","Country","Zip","City","Street","Vat"];
            columns.forEach(col => {
                const td = document.createElement("td");
                td.textContent = doc[col] || "";
                row.appendChild(td);
            });

            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Hiba történt a lekérés során:", err);
        alert("Hiba a lekérés során. Ellenőrizd, hogy a szerver fut és a publikus IP helyes.");
    }
}

document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault(); // Ne töltse újra az oldalt

    // Form adatok összegyűjtése
    const formData = {
        ID: document.querySelector('input[placeholder="ID"]').value,
        TaskID: document.querySelector('input[placeholder="TaskID"]').value,
        Name: document.querySelector('input[placeholder="Name"]').value,
        Partner_type: document.querySelector('input[placeholder="Partner_type"]').value,
        Completion_type: document.querySelector('input[placeholder="Completion_type"]').value,
        Finance_type: document.querySelector('input[placeholder="Finance_type"]').value,
        Country: document.querySelector('input[placeholder="Country"]').value,
        Zip: document.querySelector('input[placeholder="Zip"]').value,
        City: document.querySelector('input[placeholder="City"]').value,
        Street: document.querySelector('input[placeholder="Street"]').value,
        Email: document.querySelector('input[placeholder="Email"]').value,
        Reg_number: document.querySelector('input[placeholder="Reg_number"]').value,
        Vat: document.querySelector('input[placeholder="Vat"]').value,
        EU_vat: document.querySelector('input[placeholder="EU_vat"]').value,
        Bank: document.querySelector('input[placeholder="Bank"]').value,
        Invoice_type: document.querySelector('input[placeholder="Invoice_type"]').value,
        Currency: document.querySelector('input[placeholder="Currency"]').value,
        Language: document.querySelector('input[placeholder="Language"]').value,
        Day: document.querySelector('input[placeholder="Day"]').value
    };

    try {
            fetch(`https://13.60.229.11/partners`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });


        if (!res.ok) throw new Error("Hiba a mentés során: " + res.status);
        alert("Sikeres mentés!");
        loadData(); // Táblázat frissítése
    } catch (err) {
        console.error(err);
        alert("Hiba történt a mentés során.");
    }
});




