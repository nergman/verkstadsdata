document.addEventListener('DOMContentLoaded', () => {
    const calculateButton = document.getElementById('calculate-button');
    const presetSelectors = document.querySelectorAll('.preset-selector');
    const chartContext = document.getElementById('schaeffler-diagram').getContext('2d');
    let schaefflerChart;

    const schaefflerBoundaries = {
        // Using straight lines to better match the reference photo
        martensite_top: [{x: 0, y: 25.5}, {x: 24, y: 4}],
        martensite_bottom:    [{x: 0, y: 19.5}, {x: 20.5, y: 2.5}],
        ferrite_martensite:[{x: 0, y: 7}, {x: 2.5, y: 0}],
        ferrite_0: [{x: 7.5, y:0}, {x:34.5, y:30}],
        ferrite_100: [{x: 13, y:0}, {x:40, y:9}]
    };

    const steelGradeData = {
        "1672": { nickel: 0, manganese: 1.2, carbon: 0.18, nitrogen: 0, chromium: 0, molybdenum: 0, silicon: 0.4, niobium: 0, vanadium: 0.05, copper: 0.3 },
        "Domex 355": { nickel: 0, manganese: 1.5, carbon: 0.12, nitrogen: 0, chromium: 0, molybdenum: 0, silicon: 0.3, niobium: 0.03, vanadium: 0, copper: 0 },
        "Domex 420": { nickel: 0, manganese: 1.6, carbon: 0.16, nitrogen: 0, chromium: 0, molybdenum: 0, silicon: 0.4, niobium: 0.04, vanadium: 0, copper: 0 },
        "1914": { nickel: 0, manganese: 0.3, carbon: 1.0, nitrogen: 0, chromium: 1.5, molybdenum: 0, silicon: 0.25, niobium: 0, vanadium: 0, copper: 0 },
        "2541": { nickel: 0, manganese: 1.15, carbon: 0.16, nitrogen: 0, chromium: 0.95, molybdenum: 0, silicon: 0.2, niobium: 0, vanadium: 0, copper: 0 },
        "1.4006": { nickel: 0.5, manganese: 0.8, carbon: 0.12, nitrogen: 0, chromium: 12.5, molybdenum: 0, silicon: 0.5, niobium: 0, vanadium: 0, copper: 0 }, // 410
        "1.4021": { nickel: 0.5, manganese: 1.0, carbon: 0.20, nitrogen: 0, chromium: 13.0, molybdenum: 0, silicon: 0.5, niobium: 0, vanadium: 0, copper: 0 }, // 420
        "2205": { nickel: 5.5, manganese: 1.5, carbon: 0.02, nitrogen: 0.17, chromium: 22.5, molybdenum: 3.2, silicon: 0.5, niobium: 0, vanadium: 0, copper: 0 },
        "4301": { nickel: 9.0, manganese: 1.5, carbon: 0.05, nitrogen: 0.05, chromium: 18.5, molybdenum: 0, silicon: 0.5, niobium: 0, vanadium: 0, copper: 0 },
        "4401": { nickel: 11.5, manganese: 1.5, carbon: 0.05, nitrogen: 0.05, chromium: 17.5, molybdenum: 2.25, silicon: 0.5, niobium: 0, vanadium: 0, copper: 0 },
        "4404": { nickel: 11.5, manganese: 1.5, carbon: 0.02, nitrogen: 0.05, chromium: 17.5, molybdenum: 2.25, silicon: 0.5, niobium: 0, vanadium: 0, copper: 0 },
        "4571": { nickel: 11.5, manganese: 1.5, carbon: 0.05, nitrogen: 0, chromium: 17.5, molybdenum: 2.25, silicon: 0.5, niobium: 0.3, vanadium: 0, copper: 0 },
        "4818": { nickel: 11.0, manganese: 1.0, carbon: 0.06, nitrogen: 0.20, chromium: 21.0, molybdenum: 0, silicon: 2.0, niobium: 0, vanadium: 0, copper: 0 },
        "4828": { nickel: 12.0, manganese: 1.5, carbon: 0.15, nitrogen: 0, chromium: 20.0, molybdenum: 0, silicon: 2.0, niobium: 0, vanadium: 0, copper: 0 },
        "4833": { nickel: 13.0, manganese: 1.5, carbon: 0.10, nitrogen: 0, chromium: 23.0, molybdenum: 0, silicon: 1.0, niobium: 0, vanadium: 0, copper: 0 },
        "4841": { nickel: 20.0, manganese: 1.5, carbon: 0.15, nitrogen: 0, chromium: 25.0, molybdenum: 0, silicon: 1.0, niobium: 0, vanadium: 0, copper: 0 },
        "4845": { nickel: 20.0, manganese: 1.5, carbon: 0.05, nitrogen: 0, chromium: 25.0, molybdenum: 0, silicon: 1.0, niobium: 0, vanadium: 0, copper: 0 },
        "4854": { nickel: 18.0, manganese: 0.5, carbon: 0.01, nitrogen: 0.20, chromium: 20.0, molybdenum: 6.1, silicon: 0.3, niobium: 0, vanadium: 0, copper: 0.7 },
        "4872": { nickel: 20.0, manganese: 1.5, carbon: 0.10, nitrogen: 0, chromium: 20.0, molybdenum: 0, silicon: 0.5, niobium: 0, vanadium: 0, copper: 0 },
        "4876": { nickel: 32.0, manganese: 0.8, carbon: 0.05, nitrogen: 0, chromium: 21.0, molybdenum: 0, silicon: 0.5, niobium: 0, vanadium: 0, copper: 0 },
        "4878": { nickel: 10.5, manganese: 1.5, carbon: 0.06, nitrogen: 0, chromium: 18.0, molybdenum: 0, silicon: 0.5, niobium: 0, vanadium: 0, copper: 0 },
        "4886": { nickel: 42.0, manganese: 0.5, carbon: 0.03, nitrogen: 0, chromium: 21.5, molybdenum: 3.0, silicon: 0.2, niobium: 0.9, vanadium: 0, copper: 2.25 },
        // TIG Filler metal compositions (ER series)
        "ER308LSi": { nickel: 10, manganese: 1.8, carbon: 0.02, nitrogen: 0, chromium: 20, molybdenum: 0, silicon: 0.8, niobium: 0, vanadium: 0, copper: 0 },
        "ER309L": { nickel: 13.5, manganese: 1.8, carbon: 0.02, nitrogen: 0, chromium: 23.5, molybdenum: 0, silicon: 0.4, niobium: 0, vanadium: 0, copper: 0 },
        "ER312": { nickel: 9, manganese: 1.8, carbon: 0.1, nitrogen: 0, chromium: 29, molybdenum: 0, silicon: 0.4, niobium: 0, vanadium: 0, copper: 0 },
        "ER316LSi": { nickel: 12, manganese: 1.8, carbon: 0.02, nitrogen: 0, chromium: 18.5, molybdenum: 2.2, silicon: 0.8, niobium: 0, vanadium: 0, copper: 0 }
    };

    const elements = ["nickel", "manganese", "carbon", "nitrogen", "chromium", "molybdenum", "silicon", "niobium", "vanadium", "copper"];

    // Register the datalabels plugin with Chart.js
    Chart.register(ChartDataLabels);

    initializeChart();

    calculateButton.addEventListener('click', handleCalculation);
    presetSelectors.forEach(selector => selector.addEventListener('change', handlePresetChange));
    document.querySelectorAll('input[name="welding-process"]').forEach(radio => {
        radio.addEventListener('change', handleCalculation);
    });

    function handlePresetChange(event) {
        const selectedGrade = event.target.value;
        const materialId = event.target.id.split('-')[1];
        const gradeData = steelGradeData[selectedGrade];

        if (gradeData) {
            elements.forEach(el => {
                const input = document.getElementById(`${el}-${materialId}`);
                if (input) input.value = gradeData[el] || 0;
            });
            handleCalculation();
        }
    }

    function getMaterialComposition(materialId) {
        const composition = {};
        elements.forEach(el => {
            const input = document.getElementById(`${el}-${materialId}`);
            composition[el] = parseFloat(input.value) || 0;
        });
        return composition;
    }

    function calculateEquivalents(composition) {
        const niEq = composition.nickel + (0.5 * composition.manganese) + (30 * (composition.carbon + composition.nitrogen));
        const crEq = composition.chromium + composition.molybdenum + (1.5 * composition.silicon) + (0.5 * composition.niobium);
        return { niEq, crEq };
    }

    function calculateCarbonEquivalent(composition) {
        const ce = composition.carbon +
                   composition.manganese / 6 +
                   (composition.chromium + composition.molybdenum + composition.vanadium) / 5 +
                   (composition.nickel + composition.copper) / 15;
        return ce;
    }

    function calculatePREN(composition) {
        // Pitting Resistance Equivalent Number: PREN = %Cr + 3.3 * %Mo + 16 * %N
        const pren = composition.chromium + (3.3 * composition.molybdenum) + (16 * composition.nitrogen);
        return pren;
    }

    function handleCalculation() {
        const comp1 = getMaterialComposition(1);
        const comp2 = getMaterialComposition(2);

        const eq1 = calculateEquivalents(comp1);
        const eq2 = calculateEquivalents(comp2);

        const ce1 = calculateCarbonEquivalent(comp1);
        const ce2 = calculateCarbonEquivalent(comp2);

        const pren1 = calculatePREN(comp1);
        const pren2 = calculatePREN(comp2);

        const preset1Selector = document.getElementById('preset-1');
        const preset2Selector = document.getElementById('preset-2');
        const name1 = preset1Selector.value ? preset1Selector.options[preset1Selector.selectedIndex].text : 'Material 1';
        const name2 = preset2Selector.value ? preset2Selector.options[preset2Selector.selectedIndex].text : 'Material 2';

        // Assume a 50/50 mix of base materials in the weld zone (before filler)
        const mixedComp = {};
        elements.forEach(el => {
            mixedComp[el] = (comp1[el] + comp2[el]) / 2;
        });
        const mixedEq = calculateEquivalents(mixedComp);

        // Target a stable austenitic structure (e.g., Ni-eq=18, Cr-eq=19)
        const targetEq = { niEq: 18, crEq: 19 };
        const dilution = 0.3; // Typical weld dilution is 30%

        const fillerEq = {
            niEq: (targetEq.niEq - (1 - dilution) * mixedEq.niEq) / dilution,
            crEq: (targetEq.crEq - (1 - dilution) * mixedEq.crEq) / dilution
        };

        updateResults(comp1, comp2, mixedEq, fillerEq, name1, name2, ce1, ce2, pren1, pren2);
    }

    function getFillerDesignation(baseName, process) {
        const designations = {
            'ER308LSi': { TIG: 'ER308LSi', MIG_MAG: 'ER308LSi', MMA: 'E308L-17' },
            'ER316LSi': { TIG: 'ER316LSi', MIG_MAG: 'ER316LSi', MMA: 'E316L-17' },
            'ER309L':   { TIG: 'ER309L',   MIG_MAG: 'ER309L',   MMA: 'E309L-16' },
            'ER312':    { TIG: 'ER312',    MIG_MAG: 'ER312',    MMA: 'E312-16' }
        };
        const processTerms = {
            TIG: 'tillsatsstav',
            MIG_MAG: 'svetstråd',
            MMA: 'svetselektrod'
        };
        
        if (designations[baseName]) {
            return {
                name: designations[baseName][process],
                term: processTerms[process]
            };
        }
        return { name: baseName, term: 'tillsatsmaterial' };
    }

    function getFillerRecommendation(comp1, comp2, mixedEq) {
        const eq1 = calculateEquivalents(comp1);
        const eq2 = calculateEquivalents(comp2);

        const isCarbon1 = eq1.crEq < 2;
        const isCarbon2 = eq2.crEq < 2;

        // Rule for Martensitic/difficult welds
        if (mixedEq.niEq < 8 && mixedEq.crEq < 18) {
            return {
                fillerBaseName: 'ER312',
                explanation: 'Denna kombination riskerar att skapa en spröd martensitisk struktur. En <b>%FILLER_NAME%</b> (%FILLER_TERM%) rekommenderas. Dess höga kromhalt och ferritiska struktur motverkar sprickbildning i svåra applikationer.'
            };
        }

        // Rule for Carbon Steel to Stainless Steel
        if (isCarbon1 !== isCarbon2) {
            return {
                fillerBaseName: 'ER309L',
                explanation: 'För svetsning av kolstål mot rostfritt rekommenderas en <b>%FILLER_NAME%</b> (%FILLER_TERM%). Den är "överlegerat" för att säkerställa att den slutliga svetsen, efter utspädning, landar säkert i det austenitiska området.'
            };
        }

        // Rules for similar stainless steels
        if (!isCarbon1 && !isCarbon2) {
            // 316 to 316
            if (comp1.molybdenum > 1 && comp2.molybdenum > 1) {
                return { fillerBaseName: 'ER316LSi', explanation: 'För att svetsa molybden-legerade rostfria stål, använd en matchande <b>%FILLER_NAME%</b> (%FILLER_TERM%). Detta säkerställer att svetsens korrosionsmotstånd (PREN-värde) matchar grundmaterialet.' };
            }
            // 304 to 304
            if (comp1.molybdenum < 1 && comp2.molybdenum < 1 && eq1.crEq > 17 && eq2.crEq > 17) {
                return { fillerBaseName: 'ER308LSi', explanation: 'För att svetsa vanliga 18-8 (304-typ) rostfria stål, använd en <b>%FILLER_NAME%</b> (%FILLER_TERM%). Den högre kiselhalten är idealisk för TIG/MIG.' };
            }
            // Dissimilar stainless (e.g., 304 to 316)
            return {
                fillerBaseName: 'ER309L',
                explanation: 'För svetsning av olika rostfria kvaliteter är <b>%FILLER_NAME%</b> (%FILLER_TERM%) ett säkert val. Dess höga PREN-värde säkerställer god korrosionsbeständighet i den färdiga svetsen.'
            };
        }

        // Default case (e.g., two carbon steels)
        return null;
    }

    function updateResults(comp1, comp2, mixedEq, fillerEq, name1, name2, ce1, ce2, pren1, pren2) {
        const resultsContainer = document.getElementById('result-points');
        const eq1 = calculateEquivalents(comp1);
        const eq2 = calculateEquivalents(comp2);
        resultsContainer.innerHTML = `
            <p>${name1}: <span>Ni-ekv: ${eq1.niEq.toFixed(2)}, Cr-ekv: ${eq1.crEq.toFixed(2)}, CE: ${ce1.toFixed(2)}, PREN: ${pren1.toFixed(1)}</span></p>
            <p>${name2}: <span>Ni-ekv: ${eq2.niEq.toFixed(2)}, Cr-ekv: ${eq2.crEq.toFixed(2)}, CE: ${ce2.toFixed(2)}, PREN: ${pren2.toFixed(1)}</span></p>
            <p>50/50 Mix: <span>Ni-ekv: ${mixedEq.niEq.toFixed(2)}, Cr-ekv: ${mixedEq.crEq.toFixed(2)}</span></p>
        `;

        const recommendationContentEl = document.getElementById('recommendation-content');
        const selectedProcess = document.querySelector('input[name="welding-process"]:checked').value;
        const recommendation = getFillerRecommendation(comp1, comp2, mixedEq);
        
        let chartPoints = [
            { ...eq1, label: name1 },
            { ...eq2, label: name2 },
            { ...mixedEq, label: '50/50 Mix' }
        ];

        if (recommendation) {
            const carbonSteelCE = eq1.crEq < 2 ? ce1 : (eq2.crEq < 2 ? ce2 : 0);
            const fillerDesignation = getFillerDesignation(recommendation.fillerBaseName, selectedProcess);
            const fillerComp = steelGradeData[recommendation.fillerBaseName]; // Composition is based on the base name
            const fillerEqRec = calculateEquivalents(fillerComp);
            const fillerPren = calculatePREN(fillerComp);

            const dilution = 0.3;
            const finalWeldComp = {};
            elements.forEach(el => {
                const mixedBase = (comp1[el] + comp2[el]) / 2;
                finalWeldComp[el] = (mixedBase * dilution) + (fillerComp[el] * (1 - dilution));
            });
            const finalWeldEq = calculateEquivalents(finalWeldComp);

            let explanationText = recommendation.explanation
                .replace('%FILLER_NAME%', fillerDesignation.name)
                .replace('%FILLER_TERM%', fillerDesignation.term);

            let recommendationText = `<h3>Rekommendation: ${fillerDesignation.name}</h3><p>${explanationText}</p>
                <p>Tillsatsmaterial PREN: <b>${fillerPren.toFixed(1)}</b></p>
                <p>Förväntad slutlig svets: <b>Ni-ekv: ${finalWeldEq.niEq.toFixed(2)}, Cr-ekv: ${finalWeldEq.crEq.toFixed(2)}</b></p>`;
            
            if (carbonSteelCE > 0.45) {
                recommendationText += `<p style="color: #856404; background-color: #fff3cd; padding: 10px; border-radius: 4px;"><b>Varning:</b> Kolstålets karbonekvivalent (CE) är <b>${carbonSteelCE.toFixed(2)}</b>. Förvärmning av kolstålet rekommenderas starkt.</p>`;
            }
            recommendationContentEl.innerHTML = recommendationText;

            chartPoints.push({ ...fillerEqRec, label: `${fillerDesignation.name} Filler` });
            chartPoints.push({ ...finalWeldEq, label: 'Slutlig Svets' });
            
        } else {
            recommendationContentEl.innerHTML = `
                <p>För att uppnå en austenitisk struktur, sikta på ett svetsgods med följande ekvivalenter:</p>
                <p id="filler-recommendation"><span>Ni-ekv: ${fillerEq.niEq.toFixed(2)}, Cr-ekv: ${fillerEq.crEq.toFixed(2)}</span></p>
            `;
            chartPoints.push({ ...fillerEq, label: 'Målstruktur' });
        }
        
        updateChart(chartPoints);
    }

    function initializeChart() {
        // Corrected ferrite percentage lines based on user feedback to match reference photo
        const ferriteLines = {
            '5%':  [{x: 15, y: 7.5}, {x: 37, y: 30}],
            '10%': [{x: 15.5, y: 7}, {x: 40, y: 29}],
            '20%': [{x: 16, y: 6}, {x: 40, y: 23}],
            '40%': [{x: 17, y: 5.5}, {x: 40, y: 19}],
            '80%': [{x: 18, y: 4}, {x: 40, y: 15}],
        };

        const ferriteDatasets = Object.keys(ferriteLines).map(key => ({
            label: key,
            data: ferriteLines[key],
            borderColor: 'rgba(100, 100, 100, 0.6)',
            borderWidth: 1,
            showLine: true,
            pointRadius: 0,
            borderDash: [4, 4],
            type: 'line',
            fill: false,
            datalabels: {
                formatter: (value, context) => context.dataset.label,
                color: 'rgba(100, 100, 100, 0.8)',
                align: 'start',
                anchor: 'start',
                font: { size: 10 }
            }
        }));

        // Add datasets for phase labels
        const phaseLabels = [
            { label: 'Austenit', data: [{x: 22, y: 22}], textColor: 'rgba(0, 0, 0, 0.4)' },
            { label: 'Martensit', data: [{x: 8, y: 4}], textColor: 'rgba(0, 0, 0, 0.4)' },
            { label: 'Ferrit', data: [{x: 32, y: 2}], textColor: 'rgba(0, 0, 0, 0.4)' },
            { label: 'A + M', data: [{x: 14, y: 10}], textColor: 'rgba(0, 0, 0, 0.4)' },
            { label: 'A + F', data: [{x: 28, y: 15}], textColor: 'rgba(0, 0, 0, 0.4)' },
            { label: 'F + M', data: [{x: 10, y: 1}], textColor: 'rgba(0, 0, 0, 0.4)' },
        ];

        const labelDatasets = phaseLabels.map(p => ({
            label: p.label,
            data: p.data,
            pointRadius: 0,
            showLine: false,
            datalabels: {
                formatter: (value, context) => context.dataset.label,
                color: p.textColor,
                align: 'center',
                font: { size: 14, weight: 'bold' }
            }
        }));

        schaefflerChart = new Chart(chartContext, {
            type: 'scatter',
            plugins: [ChartDataLabels],
            data: {
                datasets: [
                    // Phase Regions defined by 0% and 100% ferrite lines
                    { id: 'boundary-ferrite-0', label: '0% Ferrit Gräns', data: schaefflerBoundaries.ferrite_0, borderColor: 'rgba(0, 0, 0, 0.8)', borderWidth: 2, showLine: true, pointRadius: 0, datalabels: { display: false }, fill: false },
                    { id: 'boundary-ferrite-100', label: '100% Ferrit Gräns', data: schaefflerBoundaries.ferrite_100, borderColor: 'rgba(0, 0, 0, 0.8)', borderWidth: 2, showLine: true, pointRadius: 0, datalabels: { display: false }, fill: false },
                    { id: 'boundary-martensite-top', label: 'Martensit Top', data: schaefflerBoundaries.martensite_top, borderColor: 'rgba(0, 0, 0, 0.8)', borderWidth: 2, showLine: true, pointRadius: 0, datalabels: { display: false }, fill: false },
                    { id: 'boundary-martensite-bottom', label: 'Martensit Bottom', data: schaefflerBoundaries.martensite_bottom, borderColor: 'rgba(0, 0, 0, 0.8)', borderWidth: 2, showLine: true, pointRadius: 0, datalabels: { display: false }, fill: false },
                    { id: 'boundary-ferrite-martensite', label: 'Ferrit-Martensit', data: schaefflerBoundaries.ferrite_martensite, borderColor: 'rgba(0, 0, 0, 0.8)', borderWidth: 2, showLine: true, pointRadius: 0, datalabels: { display: false }, fill: false },
                    
                    // Dynamic Points
                    { id: 'material-1', label: 'Material 1', data: [], backgroundColor: 'red', pointRadius: 6, pointHoverRadius: 8, datalabels: { display: false } },
                    { id: 'material-2', label: 'Material 2', data: [], backgroundColor: 'blue', pointRadius: 6, pointHoverRadius: 8, datalabels: { display: false } },
                    { id: 'mix-50-50', label: '50/50 Mix', data: [], backgroundColor: 'purple', pointRadius: 6, pointHoverRadius: 8, datalabels: { display: false } },
                    { id: 'filler-target', label: 'Mål/Filler', data: [], backgroundColor: 'green', borderColor: 'green', pointStyle: 'star', radius: 10, hoverRadius: 12, datalabels: { display: false } },
                    {
                        id: 'tie-line',
                        label: 'Svetsriktning',
                        data: [],
                        borderColor: 'orange',
                        borderWidth: 2,
                        showLine: true,
                        pointRadius: 0,
                        borderDash: [5, 5],
                        datalabels: { display: false }
                    },
                    { id: 'final-weld', label: 'Slutlig Svets', data: [], backgroundColor: 'black', borderColor: 'black', pointStyle: 'crossRot', radius: 10, hoverRadius: 12, datalabels: { display: false } },

                ].concat(ferriteDatasets).concat(labelDatasets)
            },
            options: {
                responsive: true,
                maintainAspectRatio: true, // Enforce the aspect ratio
                aspectRatio: 40 / 30,      // Set aspect ratio to match scales (width/height)
                scales: {
                    x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Kromekvivalent (Cr-eq)' }, min: 0, max: 40, ticks: { stepSize: 2 } },
                    y: { title: { display: true, text: 'Nickelekvivalent (Ni-eq)' }, min: 0, max: 30, ticks: { stepSize: 2 } }
                },
                plugins: {
                    datalabels: {
                        display: true,
                        font: { size: 10 }
                    },
                    legend: {
                        labels: {
                            // Filter out static and helper datasets from the legend
                            filter: item => !['0% Ferrit Gräns', '100% Ferrit Gräns', 'Martensit Top', 'Martensit Bottom', 'Ferrit-Martensit'].includes(item.text) && !item.text.endsWith('%') && !phaseLabels.some(p => p.label === item.text)
                        }
                    },
                    title: { display: true, text: 'Schaefflerdiagram' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                // Do not show tooltips for the phase or ferrite labels
                                if (phaseLabels.some(p => p.label === context.dataset.label) || context.dataset.label.endsWith('%')) {
                                    return null;
                                }
                                return `${context.dataset.label}: (Cr: ${context.parsed.x.toFixed(2)}, Ni: ${context.parsed.y.toFixed(2)})`;
                            }
                        }
                    }
                }
            }
        });
    }

    function updateChart(points) {
        const dynamicPointIds = ['material-1', 'material-2', 'mix-50-50', 'filler-target', 'final-weld'];

        // Clear all previous dynamic points
        schaefflerChart.data.datasets.forEach(dataset => {
            if (dynamicPointIds.includes(dataset.id)) {
                 dataset.data = [];
            }
        });
        
        // Map points to their dataset IDs
        const pointMapping = {
            [points[0]?.label]: 'material-1', // Material 1
            [points[1]?.label]: 'material-2', // Material 2
            '50/50 Mix': 'mix-50-50',
            'Slutlig Svets': 'final-weld',
        };

        // Set new data
        points.forEach(point => {
            let datasetId = pointMapping[point.label];
            
            // Handle the generic 'Mål/Filler' dataset
            if (point.label.includes('Filler') || point.label === 'Målstruktur') {
                datasetId = 'filler-target';
            }

            const dataset = schaefflerChart.data.datasets.find(ds => ds.id === datasetId);
            if (dataset) {
                dataset.label = point.label; // Update label for legend
                dataset.data = [{ x: point.crEq, y: point.niEq }];
            }
        });

        // Update the "tie-line" dataset
        const mixPoint = points.find(p => p.label === '50/50 Mix');
        const fillerPoint = points.find(p => p.label && p.label.includes('Filler'));
        const tieLineDataset = schaefflerChart.data.datasets.find(ds => ds.id === 'tie-line');

        if (tieLineDataset && mixPoint && fillerPoint) {
            tieLineDataset.data = [
                { x: mixPoint.crEq, y: mixPoint.niEq },
                { x: fillerPoint.crEq, y: fillerPoint.niEq }
            ];
        } else if (tieLineDataset) {
            tieLineDataset.data = []; // Clear the line if no filler is recommended
        }

        schaefflerChart.update();
    }
});
