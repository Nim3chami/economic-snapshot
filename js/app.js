let charts = {};

async function getWBCode(cca3) {
    try {
        const res = await fetch(`https://restcountries.com/v3.1/alpha/${cca3}`);
        const json = await res.json();
        return json[0]?.cca2 || cca3;
    } catch (e) {
        return cca3;
    }
}

async function fetchIndicator(wbCode, indicator) {
    try {
        const url = `https://api.worldbank.org/v2/country/${wbCode}/indicator/${indicator}?format=json&per_page=60`;
        const data = await fetch(url).then(r => r.json());
        return data[1]?.filter(x => x.value != null) || [];
    } catch {
        return [];
    }
}

async function loadData() {
    const name = document.getElementById("countryInput").value.trim();
    const error = document.getElementById("error");
    const info = document.getElementById("countryInfo");
    error.textContent = "";
    info.innerHTML = "";

    try {
        const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=true`);
        const data = await res.json();

        if (!Array.isArray(data) || data.status === 404) {
            error.textContent = "Country not found. Please check the spelling.";
            return;
        }

        const country = data[0];
        const countryName = country.name.common;
        const population = country.population.toLocaleString();
        const flag = country.flags.png;

        const wbCode = await getWBCode(country.cca3);

        // Fetch main indicators
        const gdpData = await fetchIndicator(wbCode, "NY.GDP.MKTP.CD");
        const inflationData = await fetchIndicator(wbCode, "FP.CPI.TOTL.ZG");
        const unemploymentData = await fetchIndicator(wbCode, "SL.UEM.TOTL.ZS");
        const interestData = await fetchIndicator(wbCode, "FR.INR.LEND");
        const debtData = await fetchIndicator(wbCode, "GC.DOD.TOTL.GD.ZS");

        // Fetch new indicators for country card
        const exportsData = await fetchIndicator(wbCode, "NE.EXP.GNFS.ZS");
        const importsData = await fetchIndicator(wbCode, "NE.IMP.GNFS.ZS");
        const revenueData = await fetchIndicator(wbCode, "GC.REV.XGRT.GD.ZS");
        const healthExpData = await fetchIndicator(wbCode, "SH.XPD.CHEX.GD.ZS");

        // Latest values
        const latestGDP = gdpData[0]?.value ? gdpData[0].value.toLocaleString() : "N/A";
        const latestInflation = inflationData[0]?.value ?? "N/A";
        const latestUnemployment = unemploymentData[0]?.value ?? "N/A";
        const latestInterest = interestData[0]?.value ?? "N/A";
        const latestDebt = debtData[0]?.value ?? "N/A";
        const latestExports = exportsData[0]?.value ?? "N/A";
        const latestImports = importsData[0]?.value ?? "N/A";
        const latestRevenue = revenueData[0]?.value ?? "N/A";
        const latestHealthExp = healthExpData[0]?.value ?? "N/A";

        // Display country card with stats grid
        info.innerHTML = `
            <div class="country-card">
                <div class="country-header">
                    <img src="${flag}" alt="${countryName} Flag">
                    <h2>${countryName}</h2>
                    <p><strong>Population:</strong> ${population}</p>
                </div>

                <div class="stats-grid">
                    <div class="stat-box"><h3>GDP</h3><p>${latestGDP}</p></div>
                    <div class="stat-box"><h3>Inflation (%)</h3><p>${latestInflation}</p></div>
                    <div class="stat-box"><h3>Unemployment (%)</h3><p>${latestUnemployment}</p></div>
                    <div class="stat-box"><h3>Interest Rate (%)</h3><p>${latestInterest}</p></div>
                    <div class="stat-box"><h3>Debt (% of GDP)</h3><p>${latestDebt}</p></div>
                    <div class="stat-box"><h3>Exports (% of GDP)</h3><p>${latestExports}</p></div>
                    <div class="stat-box"><h3>Imports (% of GDP)</h3><p>${latestImports}</p></div>
                    <div class="stat-box"><h3>Gov Revenue (% of GDP)</h3><p>${latestRevenue}</p></div>
                    <div class="stat-box"><h3>Health Exp (% of GDP)</h3><p>${latestHealthExp}</p></div>
                </div>
            </div>
        `;

        // Render charts for main indicators
        renderChart("gdpChart", gdpData, "GDP (USD)");
        renderChart("inflationChart", inflationData, "Inflation (%)");
        renderChart("unemploymentChart", unemploymentData, "Unemployment (%)");
        renderChart("interestChart", interestData, "Interest Rate (%)");
        renderChart("debtChart", debtData, "Debt (% of GDP)");

    } catch (e) {
        console.error(e);
        error.textContent = "Error loading data. Make sure the country name is correct or try again later.";
    }
}

// Chart rendering
function renderChart(canvasId, data, label) {
    if (!data.length) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(document.getElementById(canvasId), {
        type: "line",
        data: {
            labels: data.map(x => x.date).reverse(),
            datasets: [{
                label: label,
                data: data.map(x => x.value).reverse(),
                borderColor: "#238636",
                backgroundColor: "rgba(35, 134, 54, 0.2)",
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 6,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            animation: { duration: 1000, easing: 'easeOutQuart' },
            plugins: {
                legend: { labels: { color: "white", font: { size: 14 } } },
                title: {
                    display: true,
                    text: label + " over Years",
                    color: "white",
                    font: { size: 18 }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: "#21262d",
                    titleColor: "#58a6ff",
                    bodyColor: "white",
                    bodyFont: { size: 14 }
                }
            },
            scales: {
                x: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.05)" } },
                y: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.05)" } }
            }
        }
    });
}
