const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient("mongodb+srv://CMS_BOGRAPHIC:Kiralyok007@mgf.ym6ix.mongodb.net/?retryWrites=true&w=majority");

let partnerCollection;
let servicesCollection;

// --- Csatlakozás az adatbázishoz ---
async function connectDB() {
  await client.connect();
  const mainDB = client.db("MAIN_DATABASE");
  const servicesDB = client.db("Services");

  partnerCollection = mainDB.collection("Partner_datas");
  servicesCollection = servicesDB.collection("Services");

  console.log("MongoDB connected for both MAIN_DATABASE and Services!");
}
connectDB();

// --- Segédfüggvény: HTML táblázat generálása ---
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
      pass: "ufct kbek ysrz pegi" // App Password (ne tedd nyilvános repo-ba)
    }
  });

  const htmlContent = `
    <p>Tisztelt ${name},</p>
    <p>Az aktuálisan teljesítő partnerek listája:</p>
    ${htmlTable}
    <p>Üdvözlettel,<br>Automata értesítő</p>
  `;

  const mailOptions = {
    from: '"Automata értesítő" <penzugy.mgf@gmail.com>',
    to,
    subject: "Heti partneri státusz – Folyamatos teljesítések",
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
  console.log("E-mail elküldve:", to);
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


// --- Ütemezés: minden hétfőn 08:00-kor ---
cron.schedule("0 8 * * 1", () => {
  runWeeklySummary().catch(console.error);
});

// --- Manuális teszt endpoint ---
app.get("/run-weekly-summary", async (req, res) => {
  try {
    await runWeeklySummary();
    res.send("E-mail küldés lefutott!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Hiba a futtatás során.");
  }
});

app.listen(3001, () => console.log("Weekly service running on http://127.0.0.1:3001"));
