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
            activeTab.style.display = "none";  // Rejtse el az előző tartalmat
            activeTab.classList.remove("exiting");
        }, 500);  // Kicsúszás ideje (egyezzen a CSS transition idővel)
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




//ÚJ SZÁMLA
document.addEventListener('DOMContentLoaded', function() {
    const ujButton = document.querySelector('.ujpartner');
    const popup = document.getElementById('popup');
    const closeBtn = document.getElementById('closeBtn');
    const backgroundBlur = document.querySelector('.background-blur');

    // Popup megnyitása
    ujButton.addEventListener('click', () => {
        popup.classList.add('show'); // Popup megjelenítése
        backgroundBlur.classList.add('show'); // Háttér homályosítása
    });

    // Popup bezárása
    closeBtn.addEventListener('click', () => {
        popup.classList.remove('show'); // Popup eltüntetése
        backgroundBlur.classList.remove('show'); // Homályos hatás eltüntetése
    });
});

async function loadData() {
    const name = document.getElementById("nameFilter").value;
    const completion = document.getElementById("completionFilter").value;

    // EC2 publikus IP + Node.js szerver port
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
