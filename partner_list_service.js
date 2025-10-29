const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Szolgáltatás neve – több szolgáltatás esetén így azonosítható
const serviceName = "PartnerListService";

// 🔹 MongoDB kapcsolat
const client = new MongoClient(
  "mongodb+srv://CMS_BOGRAPHIC:Kiralyok007@mgf.ym6ix.mongodb.net/?retryWrites=true&w=majority"
);

let partnerCollection;
let serviceCollection;
let logsCollection;

// --- Adatbázis csatlakozás ---
async function connectDB() {
  await client.connect();
  const mainDB = client.db("MAIN_DATABASE");

  partnerCollection = mainDB.collection("Partner_datas"); // partnerek
  serviceCollection = mainDB.collection("Service"); // címzettek, beállítások
  logsCollection = mainDB.collection("service_logs"); // logok

  console.log("✅ MongoDB connected – MAIN_DATABASE alatt minden kollekció elérhető.");
}
connectDB();

// --- Log írás ---
async function writeLog(status, message, details = {}) {
  const logEntry = {
    serviceName, // pl. PartnerListService
    timestamp: new Date(),
    status, // "INFO", "SUCCESS", "ERROR"
    message,
    details
  };

  try {
    await logsCollection.insertOne(logEntry);
  } catch (err) {
    console.error("❌ Log mentési hiba:", err.message);
  }

  console.log(`[${serviceName}] [${status}] ${message}`);
}

// --- HTML táblázat generálása ---
function generateHTMLTable(data) {
  if (!data.length) return "<p>Nincs elérhető partner.</p>";

  let table = `
    <table border="1" cellspacing="0" cellpadding="5" style="border-collapse: collapse; width: 100%;">
      <thead style="background-color: #f2f2f2;">
        <tr>
          <th>ID</th><th>TaskID</th><th>Name</th><th>Partner_type</th><th>Country</th>
          <th>Zip</th><th>City</th><th>Street</th><th>Vat</th><th>EU_vat</th>
          <th>Finance_type</th><th>Reg_number</th><th>Email</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach(item => {
    table += `
      <tr>
        <td>${item.ID || ""}</td>
        <td>${item.TaskID || ""}</td>
        <td>${item.Name || ""}</td>
        <td>${item.Partner_type || ""}</td>
        <td>${item.Country || ""}</td>
        <td>${item.Zip || ""}</td>
        <td>${item.City || ""}</td>
        <td>${item.Street || ""}</td>
        <td>${item.Vat || ""}</td>
        <td>${item.EU_vat || ""}</td>
        <td>${item.Finance_type || ""}</td>
        <td>${item.Reg_number || ""}</td>
        <td>${item.Email || ""}</td>
      </tr>
    `;
  });

  table += "</tbody></table>";
  return table;
}

// --- E-mail küldés ---
async function sendEmail(to, name, htmlTable) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "penzugy.mgf@gmail.com",
      pass: "ufct kbek ysrz pegi" // Gmail App Password
    }
  });

  const htmlContent = `
    <p>Tisztelt ${name},</p>
    <p>Az aktuálisan teljesítő partnerek listája:</p>
    ${htmlTable}
    <p>Üdvözlettel,<br>Automata értesítő (${serviceName})</p>
  `;

  const mailOptions = {
    from: '"Automata értesítő" <penzugy.mgf@gmail.com>',
    to,
    subject: "Heti partneri státusz – Folyamatos teljesítések",
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    await writeLog("SUCCESS", `E-mail elküldve: ${to}`);
  } catch (error) {
    await writeLog("ERROR", `E-mail küldési hiba: ${error.message}`, { to });
    throw error;
  }
}

// --- Fő folyamat ---
async function runWeeklySummary() {
  await writeLog("INFO", "▶ Heti összefoglaló indítása...");

  try {
    // 1️⃣ Lekérdezzük az összes címzettet, ahol futtatas = "Igen"
    const recipients = await serviceCollection
      .find({ futtatas: { $regex: /^igen$/i } })
      .toArray();

    if (!recipients.length) {
      await writeLog("INFO", "⏹ Nincs engedélyezett címzett.");
      return;
    }

    // 2️⃣ 'Folyamatos' partnerek lekérdezése
    const partners = await partnerCollection
      .find({ Completion_type: "Folyamatos" })
      .toArray();

    if (!partners.length) {
      await writeLog("INFO", "❗ Nincs 'Folyamatos' partner az adatbázisban.");
      return;
    }

    // 3️⃣ HTML táblázat generálása
    const htmlTable = generateHTMLTable(partners);

    // 4️⃣ E-mail küldése minden címzettnek
    for (const recipient of recipients) {
      await sendEmail(recipient.cimzett_email, recipient.cimzett_nev, htmlTable);
      await writeLog("SUCCESS", `Heti összefoglaló elküldve: ${recipient.cimzett_email}`, {
        recipient: recipient.cimzett_email,
        count: partners.length
      });
    }
  } catch (err) {
    await writeLog("ERROR", "Hiba a heti összefoglaló során.", { error: err.message });
    console.error("❌ Hiba:", err);
  }
}


// --- Ütemezés: minden hétfőn 08:00 ---
cron.schedule("0 8 * * 1", () => {
  runWeeklySummary().catch(console.error);
});

// --- Manuális futtatás ---
app.get("/run-weekly-summary", async (req, res) => {
  try {
    await runWeeklySummary();
    res.send("E-mail küldés lefutott és logolva lett.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Hiba a futtatás során. Nézd meg a service_logs kollekciót.");
  }
});

app.listen(3001, () =>
  console.log(`[${serviceName}] running on http://127.0.0.1:3001`)
);

