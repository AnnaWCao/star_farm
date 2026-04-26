// trials/intro_trials.js
// Narrative intro sequence that walks children through the Star Farm story.
// Uses image-button-response and audio-button-response for page-by-page flow.

function buildIntroTrials() {

    // Helper: one narrated page with a "next arrow" button, full-screen image
    const narratedPage = function(imagePath, audioPath, promptText) {
        return {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <img src="${imagePath}"
                     style="width:100vw; height:85vh; object-fit:contain; display:block; margin:0;">
                ${promptText ? `<div style="font-size:22px; text-align:center; padding:10px 20px;">${promptText}</div>` : ''}
            `,
            choices: ['assets/images/next_button.png'],
            button_html: (choice) => `<img src="${choice}" style="height:80px; cursor:pointer;">`,
            data: { task: 'intro', page: imagePath },
            on_start: function() {
                if (audioPath) {
                    const audio = new Audio(audioPath);
                    audio.play().catch(e => console.log('Audio play failed:', e));
                }
                // Strip jsPsych container padding so image can go edge-to-edge
                const wrapper = document.querySelector('.jspsych-content-wrapper');
                if (wrapper) wrapper.classList.add('fullscreen-slide');
            },
            on_finish: function() {
                const wrapper = document.querySelector('.jspsych-content-wrapper');
                if (wrapper) wrapper.classList.remove('fullscreen-slide');
            }
        };
    };

    const introTrials = [];

    // Page 1: Welcome
    introTrials.push(narratedPage(
        'assets/images/main.png',
        'assets/audio/welcome.mp3',
        'Welcome to the Star Farm!'
    ));

    // Page 2: Intro narrative
    introTrials.push(narratedPage(
        'assets/images/intro1.png',
        'assets/audio/intro_narrative.mp3',
        'In the Star Farm, you will get seedlings. You need to grow them into vines. You can sell the vines to earn gold coins!'
    ));

    // Page 3: Receive first seedling
    introTrials.push(narratedPage(
        'assets/images/intro_seedling.png',
        'assets/audio/receive_seedling.mp3',
        'Look! You just received a seedling.'
    ));

    // Page 4: Drag seedling to soil (custom plugin)
    introTrials.push({
        type: draggableSeedling,
        seedling_image: 'assets/images/intro_seedling.png',
        soil_image: 'assets/images/intro_seedling_soil.png',
        prompt: 'Plant the seedling by dragging it into the soil.',
        on_drop_success_html: `
            <div style="text-align:center; padding: 60px;">
                <div style="font-size:24px; margin-bottom:30px;">Great! Your seedling is planted.</div>
                <img src="assets/images/intro_seedling_soil.png" style="max-width: 500px;">
            </div>
        `,
        success_delay_ms: 1500,
        data: { task: 'intro', page: 'plant_seedling_1' }
    });

    return introTrials;
}
