// trials/intro_trials.js
// Narrative intro sequence that walks children through the Star Farm story.
// Uses image-button-response and audio-button-response for page-by-page flow.

function buildIntroTrials() {

    // Helper: one narrated page with a "next arrow" button
    const narratedPage = function(imagePath, audioPath, promptText) {
        return {
            type: jsPsychImageButtonResponse,
            stimulus: imagePath,
            choices: ['assets/images/next_button.png'],
            button_html: '<img src="%choice%" style="height: 80px; cursor: pointer;">',
            prompt: promptText ? `<div style="font-size:20px; margin-top:20px;">${promptText}</div>` : '',
            stimulus_height: 500,
            maintain_aspect_ratio: true,
            data: { task: 'intro', page: imagePath },
            on_start: function() {
                // If audio is provided, play it via HTML5 audio
                if (audioPath) {
                    const audio = new Audio(audioPath);
                    audio.play().catch(e => console.log('Audio play failed (may need user gesture):', e));
                }
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
