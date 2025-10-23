document.addEventListener('DOMContentLoaded', () => {
    const calculateButton = document.getElementById('calculate-button');
    const presetSelectors = document.querySelectorAll('.preset-selector');
    const chartContext = document.getElementById('schaeffler-diagram').getContext('2d');
    let schaefflerChart;

    const schaefflerBoundaries = {
        martensite: [{x: 0, y: 0}, {x: 8, y: 0}, {x: 13, y: 2}, {x: 18, y: 6}],
        austenite_ferrite: [{x: 12, y: 24}, {x: 16, y: 18}, {x: 22, y: 12}, {x: 34, y: 0}],
        ferrite_line: [{x: 18, y: 0}, {x: 22, y: 2}, {x: 30, y: 8}, {x: 34, y: 12}]
    };

    const steelGradeData = {
        "1672": { nickel: 0, manganese: 1.2, carbon: 0.18, nitrogen: 0, chromium: 0, molybdenum: 0, silicon: 0.4, niobium: 0 },
        "1914": { nickel: 0, manganese: 0.3, carbon: 1.0, nitrogen: 0, chromium: 1.5, molybdenum: 0, silicon: 0.25, niobium: 0 },
        "2541": { nickel: 0, manganese: 1.15, carbon: 0.16, nitrogen: 0, chromium: 0.95, molybdenum: 0, silicon: 0.2, niobium: 0 },
        "4301": { nickel: 9.0, manganese: 1.5, carbon: 0.05, nitrogen: 0.05, chromium: 18.5, molybdenum: 0, silicon: 0.5, niobium: 0 },
        "4401": { nickel: 11.5, manganese: 1.5, carbon: 0.05, nitrogen: 0.05, chromium: 17.5, molybdenum: 2.25, silicon: 0.5, niobium: 0 },
        "4404": { nickel: 11.5, manganese: 1.5, carbon: 0.02, nitrogen: 0.05, chromium: 17.5, molybdenum: 2.25, silicon: 0.5, niobium: 0 },
        "4818": { nickel: 11.0, manganese: 1.0, carbon: 0.06, nitrogen: 0.20, chromium: 21.0, molybdenum: 0, silicon: 2.0, niobium: 0 },
        "4828": { nickel: 12.0, manganese: 1.5, carbon: 0.15, nitrogen: 0, chromium: 20.0, molybdenum: 0, silicon: 2.0, niobium: 0 },
        "4833": { nickel: 13.0, manganese: 1.5, carbon: 0.10, nitrogen: 0, chromium: 23.0, molybdenum: 0, silicon: 1.0, niobium: 0 },
        "4841": { nickel: 20.0, manganese: 1.5, carbon: 0.15, nitrogen: 0, chromium: 25.0, molybdenum: 0, silicon: 1.0, niobium: 0 },
        "4845": { nickel: 20.0, manganese: 1.5, carbon: 0.05, nitrogen: 0, chromium: 25.0, molybdenum: 0, silicon: 1.0, niobium: 0 },
        "4854": { nickel: 18.0, manganese: 0.5, carbon: 0.01, nitrogen: 0.20, chromium: 20.0, molybdenum: 6.1, silicon: 0.3, niobium: 0 },
        "4872": { nickel: 20.0, manganese: 1.5, carbon: 0.10, nitrogen: 0, chromium: 20.0, molybdenum: 0, silicon: 0.5, niobium: 0 },
        "4876": { nickel: 32.0, manganese: 0.8, carbon: 0.05, nitrogen: 0, chromium: 21.0, molybdenum: 0, silicon: 0.5, niobium: 0 },
        "4878": { nickel: 10.5, manganese: 1.5, carbon: 0.06, nitrogen: 0, chromium: 18.0, molybdenum: 0, silicon: 0.5, niobium: 0 },
        "4886": { nickel: 42.0, manganese: 0.5, carbon: 0.03, nitrogen: 0, chromium: 21.5, molybdenum: 3.0, silicon: 0.2, niobium: 0.9 }
    };

    const elements = ["nickel", "manganese", "carbon", "nitrogen", "chromium", "molybdenum", "silicon", "niobium"];

    initializeChart();

    calculateButton.addEventListener('click', handleCalculation);
    presetSelectors.forEach(selector => selector.addEventListener('change', handlePresetChange));

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

    function handleCalculation() {
        const comp1 = getMaterialComposition(1);
        const comp2 = getMaterialComposition(2);

        const eq1 = calculateEquivalents(comp1);
        const eq2 = calculateEquivalents(comp2);

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

        // The fillerEq calculation was producing impractically high values.
        // Instead, we will show the line from the mix to the target.
        // The welder can choose a real filler rod that lies on this path.
        const fillerEq = {
            niEq: (targetEq.niEq - (1 - dilution) * mixedEq.niEq) / dilution,
            crEq: (targetEq.crEq - (1 - dilution) * mixedEq.crEq) / dilution
        };

        updateResults(eq1, eq2, mixedEq, fillerEq, name1, name2);
        updateChart([
            { ...eq1, label: name1 },
            { ...eq2, label: name2 },
            { ...mixedEq, label: '50/50 Mix' },
            { ...targetEq, label: 'Målstruktur' }
        ]);
    }

    function updateResults(eq1, eq2, mixedEq, fillerEq, name1, name2) {
        const resultsContainer = document.getElementById('result-points');
        resultsContainer.innerHTML = `
            <p>${name1}: <span>Ni-ekv: ${eq1.niEq.toFixed(2)}, Cr-ekv: ${eq1.crEq.toFixed(2)}</span></p>
            <p>${name2}: <span>Ni-ekv: ${eq2.niEq.toFixed(2)}, Cr-ekv: ${eq2.crEq.toFixed(2)}</span></p>
            <p>50/50 Mix: <span>Ni-ekv: ${mixedEq.niEq.toFixed(2)}, Cr-ekv: ${mixedEq.crEq.toFixed(2)}</span></p>
        `;

        const recommendationEl = document.querySelector('#filler-recommendation span');
        recommendationEl.textContent = `Ni-ekv: ${fillerEq.niEq.toFixed(2)}, Cr-ekv: ${fillerEq.crEq.toFixed(2)}`;
    }

    function initializeChart() {
        schaefflerChart = new Chart(chartContext, {
            type: 'scatter',
            data: {
                datasets: [
                    { label: 'Martensit', data: schaefflerBoundaries.martensite, borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 2, fill: 'origin', backgroundColor: 'rgba(255, 99, 132, 0.1)', showLine: true, pointRadius: 0 },
                    { label: 'Austenit + Ferrit', data: schaefflerBoundaries.austenite_ferrite, borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 2, fill: 'origin', backgroundColor: 'rgba(54, 162, 235, 0.1)', showLine: true, pointRadius: 0 },
                    { label: 'Ferrit Gräns', data: schaefflerBoundaries.ferrite_line, borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 2, showLine: true, pointRadius: 0, borderDash: [5, 5] },
                    { label: 'Material 1', data: [], backgroundColor: 'red', pointRadius: 6, pointHoverRadius: 8 },
                    { label: 'Material 2', data: [], backgroundColor: 'blue', pointRadius: 6, pointHoverRadius: 8 },
                    { label: '50/50 Mix', data: [], backgroundColor: 'purple', pointRadius: 6, pointHoverRadius: 8 },
                    { label: 'Målstruktur', data: [], backgroundColor: 'green', borderColor: 'green', pointStyle: 'star', radius: 10, hoverRadius: 12 },
                    {
                        label: 'Svetsriktning',
                        data: [],
                        borderColor: 'orange',
                        borderWidth: 2,
                        showLine: true,
                        pointRadius: 0,
                        borderDash: [5, 5],
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Kromekvivalent (Cr-eq)' }, min: 0, max: 34 },
                    y: { title: { display: true, text: 'Nickelekvivalent (Ni-eq)' }, min: 0, max: 40 }
                },
                plugins: {
                    title: { display: true, text: 'Schaefflerdiagram' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: (Cr: ${context.parsed.x.toFixed(2)}, Ni: ${context.parsed.y.toFixed(2)})`;
                            }
                        }
                    }
                }
            }
        });
    }

    function updateChart(points) {
        // The datasets for the points start at index 3
        const pointDatasets = schaefflerChart.data.datasets.slice(3);
        
        points.forEach((point, index) => {
            if (pointDatasets[index]) {
                pointDatasets[index].label = point.label; // Update the dataset's label
                pointDatasets[index].data = [{ x: point.crEq, y: point.niEq }];
            }
        });

        // Update the "tie-line" dataset (index 7)
        const mixPoint = points[2]; // 50/50 Mix
        const targetPoint = points[3]; // Målstruktur
        if (mixPoint && targetPoint) {
            schaefflerChart.data.datasets[7].data = [
                { x: mixPoint.crEq, y: mixPoint.niEq },
                { x: targetPoint.crEq, y: targetPoint.niEq }
            ];
        }

        schaefflerChart.update();
    }
});
