
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

document.querySelector("#partnerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

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
        const res = await fetch("/partners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error("Hiba a mentés során: " + res.status);

        alert("Sikeres mentés!");
        loadData(); // frissíti a táblázatot
    } catch (err) {
        console.error(err);
        alert("Hiba történt a mentés során.");
    }
});





