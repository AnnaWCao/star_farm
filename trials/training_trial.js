// trials/training_trial.js
// Factory that builds training and testing blocks for a given function
// with a given visual skin.

function buildFunctionBlock(functionDef, skin, functionIndex) {

    const trials = [];

    // Function intro: present the new vine and fertilizer
    trials.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="text-align:center; padding: 40px;">
                <div style="font-size:24px; margin-bottom:20px;">
                    You received another seedling!
                </div>
                <img src="${skin.vine_image}" style="max-height: 200px; margin: 20px;">
                <div style="font-size:22px; margin-bottom:20px;">
                    This time, you will use <b>${skin.fertilizer_name}</b> to help it grow.
                </div>
                <img src="${skin.fertilizer_image}" style="max-height: 100px; margin: 20px;">
                <div style="font-size:20px; margin-top:30px;">
                    Different amounts of ${skin.fertilizer_name} will make the vine grow to different lengths.
                    You need to guess how long the vine will be!
                </div>
            </div>
        `,
        choices: ['Ready!'],
        button_html: (choice) => `<button class="jspsych-btn" style="font-size:22px; padding:16px 40px;">${choice}</button>`,
        data: {
            task: 'function_intro',
            function_type: functionDef.name,
            function_index: functionIndex
        }
    });

    // Training trials
    const trainingData = buildTrainingTrials(functionDef);

    trainingData.forEach((trialData, idx) => {
        trials.push({
            type: draggableBarResponse,
            input_value: trialData.x,
            true_output: trialData.y,
            fertilizer_image: skin.fertilizer_image,
            vine_image: skin.vine_image,
            soil_image: 'assets/images/soil.png',
            show_feedback: true,
            feedback_duration_ms: SETTINGS.FEEDBACK_DURATION_MS,
            feedback_delay_ms: SETTINGS.FEEDBACK_DELAY_MS,
            prompt: `Look! This much ${skin.fertilizer_name} was used. How long will the vine be?`,
            progress_text: SETTINGS.SHOW_PROGRESS
                ? `Training trial ${idx + 1} of ${trainingData.length}`
                : '',
            data: {
                task: 'training',
                function_type: functionDef.name,
                function_index: functionIndex,
                trial_number_within_block: idx + 1,
                block: 'training'
            },
            on_finish: function(data) {
                // Backup to localStorage in case the session crashes before CSV download
                if (SETTINGS.SAVE_PER_TRIAL) backupTrialToLocalStorage(data);
            }
        });
    });

    // Break between training and testing
    trials.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="text-align:center; padding: 60px;">
                <div style="font-size:26px; margin-bottom:20px;">
                    Great job! You've seen ${trainingData.length} vines grow!
                </div>
                <div style="font-size:22px; margin-bottom:30px;">
                    Now we'll do something a little different. <br>
                    I won't tell you the answer anymore, but you try your best!
                </div>
            </div>
        `,
        choices: ['I\'m ready!'],
        button_html: (choice) => `<button class="jspsych-btn" style="font-size:22px; padding:16px 40px;">${choice}</button>`,
        data: {
            task: 'block_break',
            function_type: functionDef.name,
            function_index: functionIndex
        }
    });

    // Testing trials
    const testingData = buildTestingTrials(functionDef);

    testingData.forEach((trialData, idx) => {
        trials.push({
            type: draggableBarResponse,
            input_value: trialData.x,
            true_output: trialData.y,
            fertilizer_image: skin.fertilizer_image,
            vine_image: skin.vine_image,
            soil_image: 'assets/images/soil.png',
            show_feedback: false,
            prompt: `Look! This much ${skin.fertilizer_name} was used. How long will the vine be?`,
            progress_text: SETTINGS.SHOW_PROGRESS
                ? `Test trial ${idx + 1} of ${testingData.length}`
                : '',
            data: {
                task: 'testing',
                function_type: functionDef.name,
                function_index: functionIndex,
                trial_number_within_block: idx + 1,
                block: 'testing',
                test_trial_type: trialData.trial_type
            },
            on_finish: function(data) {
                if (SETTINGS.SAVE_PER_TRIAL) backupTrialToLocalStorage(data);
            }
        });
    });

    return trials;
}

// Local backup of each completed trial to localStorage.
// If the session crashes before the final CSV download, this data can be
// recovered by opening browser dev tools and reading from localStorage.
function backupTrialToLocalStorage(data) {
    try {
        const existing = JSON.parse(localStorage.getItem('trial_backup') || '[]');
        existing.push(data);
        localStorage.setItem('trial_backup', JSON.stringify(existing));
    } catch (e) {
        console.warn('localStorage backup failed:', e);
    }
}
