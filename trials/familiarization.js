// trials/familiarization.js
// The familiarization trial: child drags water to a marked amount to show they
// understand the drag-to-indicate-length response mechanic.

function buildFamiliarizationTrial() {

    const pxPerCm = 37.795 * SETTINGS.CM_CALIBRATION;
    const barWidthPx = SETTINGS.BAR_LENGTH_CM * pxPerCm;
    const barHeightPx = SETTINGS.BAR_HEIGHT_CM * pxPerCm;

    // Target water amount (50 units = middle of bar)
    const targetUnits = 50;
    const targetPx = (targetUnits / 100) * barWidthPx;

    // Use the draggable-bar-response plugin but with a specific target
    // and a different prompt. The fertilizer bar shows the "water mark".
    return {
        type: draggableBarResponse,
        input_value: 0,   // no fertilizer shown in this trial
        true_output: targetUnits,
        fertilizer_image: '',
        vine_image: 'assets/images/pink_vine.png',  // placeholder; we'll use water visual
        soil_image: 'assets/images/intro_soil.png',
        show_feedback: true,
        feedback_duration_ms: 3000,
        prompt: 'Drag water to the green mark to see what happens.',
        data: { task: 'familiarization' },
        // Override input bar to show a water-level target
        on_load: function() {
            // Hide fertilizer bar, replace with water-target visualization
            const fertBar = document.querySelector('#fertilizer-bar');
            if (fertBar) {
                fertBar.innerHTML = `
                    <div style="position:absolute; left:${targetPx}px; top:-5px; width:4px; height:${barHeightPx + 10}px; background-color: #27ae60; z-index:10;"></div>
                    <div style="position:absolute; left:${targetPx - 30}px; top:-28px; font-size:14px; color: #27ae60; font-weight: bold;">target</div>
                `;
                fertBar.style.backgroundColor = '#e8f4f8';
            }
            // Hide the "Fertilizer used" label
            const labels = document.querySelectorAll('#trial-container > div > div');
            labels.forEach(l => {
                if (l.textContent && l.textContent.includes('Fertilizer')) {
                    l.textContent = 'Water target:';
                }
                if (l.textContent && l.textContent.includes('vine length')) {
                    l.textContent = 'Water you are adding:';
                }
            });
        }
    };
}
