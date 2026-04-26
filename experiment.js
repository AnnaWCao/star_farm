// experiment.js — main session orchestrator.
// Kept as a separate file rather than inlined in index.html because:
//   1. All dependencies (jsPsych, plugins, config, trial factories) must be loaded first.
//      They live in <head>; this script runs at the end of <body> once they're ready.
//      Moving it to <head> would break it — document.body is null there.
//   2. At ~300 lines of experiment logic, inlining it would make index.html a mixed
//      HTML/JS file that's hard to read and diff. Keep the skeleton and the logic separate.

// ---- 1. Startup form ----
// Experimenter fills this in before handing the iPad to the child.

function showStartupForm() {
    return new Promise((resolve) => {
        document.body.innerHTML = `
            <div style="max-width:500px; margin:80px auto; padding:40px;
                        background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <h2 style="margin-top:0;">Star Farm — Session Setup</h2>
                <p style="color:#666;">Experimenter only. Fill in before giving iPad to child.</p>

                <div style="margin:20px 0;">
                    <label style="display:block; font-weight:bold; margin-bottom:6px;">
                        Participant ID (integer):
                    </label>
                    <input type="number" id="pid-input" min="1" step="1" required
                           style="width:100%; padding:12px; font-size:18px; border:2px solid #ccc; border-radius:6px;">
                </div>

                <div style="margin:20px 0;">
                    <label style="display:block; font-weight:bold; margin-bottom:6px;">
                        Age (years, decimal allowed):
                    </label>
                    <input type="number" id="age-input" min="3" max="12" step="0.01" required
                           style="width:100%; padding:12px; font-size:18px; border:2px solid #ccc; border-radius:6px;">
                </div>

                <div style="margin:20px 0;">
                    <label style="display:block; font-weight:bold; margin-bottom:6px;">Sex (optional):</label>
                    <select id="sex-input"
                            style="width:100%; padding:12px; font-size:18px; border:2px solid #ccc; border-radius:6px;">
                        <option value="">(prefer not to say)</option>
                        <option value="F">Female</option>
                        <option value="M">Male</option>
                        <option value="O">Other</option>
                    </select>
                </div>

                <div style="margin:20px 0;">
                    <label style="display:block; font-weight:bold; margin-bottom:6px;">Condition:</label>
                    <select id="condition-input"
                            style="width:100%; padding:12px; font-size:18px; border:2px solid #ccc; border-radius:6px;">
                        <option value="auto">Auto (based on participant ID)</option>
                        <option value="1">Condition 1 — Positive Linear + Negative Linear</option>
                        <option value="2">Condition 2 — Positive Linear + Quadratic</option>
                        <option value="3">Condition 3 — Positive Linear + Exponential Growth</option>
                    </select>
                </div>

                <div style="margin:20px 0;">
                    <label style="display:block; font-weight:bold; margin-bottom:6px;">Function order:</label>
                    <select id="order-input"
                            style="width:100%; padding:12px; font-size:18px; border:2px solid #ccc; border-radius:6px;">
                        <option value="auto">Auto (counterbalanced)</option>
                        <option value="0">Function 1 first (Positive Linear first)</option>
                        <option value="1">Function 2 first (Comparison function first)</option>
                    </select>
                </div>

                <div style="margin:20px 0;">
                    <label style="display:block; font-weight:bold; margin-bottom:6px;">
                        Experimenter notes (optional):
                    </label>
                    <textarea id="notes-input" rows="2"
                              style="width:100%; padding:12px; font-size:16px; border:2px solid #ccc;
                                     border-radius:6px; resize:vertical;"></textarea>
                </div>

                <button id="start-btn"
                        style="width:100%; padding:16px; font-size:20px; background:#27ae60;
                               color:white; border:none; border-radius:8px; cursor:pointer; margin-top:20px;">
                    Start Session
                </button>
                <div id="form-error" style="color:#e74c3c; margin-top:12px; font-size:14px;"></div>
            </div>
        `;

        // URL override for quick testing: ?pid=1&age=6&cond=2&order=0
        const params = new URLSearchParams(window.location.search);
        if (params.get('pid'))   document.getElementById('pid-input').value       = params.get('pid');
        if (params.get('age'))   document.getElementById('age-input').value       = params.get('age');
        if (params.get('cond'))  document.getElementById('condition-input').value = params.get('cond');
        if (params.get('order')) document.getElementById('order-input').value     = params.get('order');

        document.getElementById('start-btn').addEventListener('click', () => {
            const pid          = parseInt(document.getElementById('pid-input').value);
            const age          = parseFloat(document.getElementById('age-input').value);
            const sex          = document.getElementById('sex-input').value;
            const notes        = document.getElementById('notes-input').value;
            const conditionRaw = document.getElementById('condition-input').value;
            const orderRaw     = document.getElementById('order-input').value;
            const err          = document.getElementById('form-error');

            if (!pid || pid < 1) {
                err.textContent = 'Please enter a valid participant ID (positive integer).';
                return;
            }
            if (!age || age < 3 || age > 12) {
                err.textContent = 'Please enter a valid age between 3 and 12.';
                return;
            }

            document.body.innerHTML = '';
            resolve({
                pid,
                age,
                sex,
                notes,
                forced_condition: conditionRaw === 'auto' ? null : parseInt(conditionRaw),
                forced_order:     orderRaw     === 'auto' ? null : parseInt(orderRaw)
            });
        });

        ['pid-input', 'age-input'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', (e) => {
                if (e.key === 'Enter') document.getElementById('start-btn').click();
            });
        });
    });
}

// ---- 2. Main entry point ----

(async function main() {

    const formData       = await showStartupForm();
    const participantId  = formData.pid;
    const participantAge = formData.age;

    const assignment = assignCondition(
        participantId,
        formData.forced_condition,
        formData.forced_order
    );

    const participantInfo = {
        participant_id:        participantId,
        age_years:             participantAge,
        sex:                   formData.sex,
        experimenter_notes:    formData.notes,
        condition_id:          assignment.condition_id,
        condition_name:        assignment.condition_name,
        cell_index:            assignment.cell_index,
        function_1_name:       assignment.function_1,
        function_2_name:       assignment.function_2,
        skin_1_id:             assignment.skin_1.id,
        skin_2_id:             assignment.skin_2.id,
        function_order_index:  assignment.order_index,
        skin_assignment_index: assignment.skin_index,
        condition_was_forced:  assignment.condition_was_forced,
        order_was_forced:      assignment.order_was_forced,
        session_start:         new Date().toISOString(),
        user_agent:            navigator.userAgent
    };

    console.log('Participant assignment:', assignment);

    // ---- 3. Initialize jsPsych ----
    // Target div must exist before initJsPsych is called; jsPsych v8 resolves display_element immediately.
    const target = document.createElement('div');
    target.id = 'jspsych-target';
    document.body.appendChild(target);

    const jsPsych = initJsPsych({
        display_element: 'jspsych-target',
        show_progress_bar: false,
        on_finish: function() {
            const enrichedData = jsPsych.data.get().values().map(row => ({ ...participantInfo, ...row }));

            const nowStr    = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const pidPadded = String(participantId).padStart(3, '0');
            const filename  = `star-farm_p${pidPadded}_${nowStr}.csv`;

            downloadCSV(enrichedData, filename);

            document.body.innerHTML = `
                <div style="text-align:center; padding: 80px; font-family: sans-serif;">
                    <h1 style="font-size: 40px;">All done! 🌱</h1>
                    <p style="font-size: 24px;">You grew so many vines!</p>
                    <p style="font-size: 16px; color: #888; margin-top: 40px;">
                        Data file downloaded: <code>${filename}</code>
                    </p>
                    <p style="font-size: 14px; color: #888; margin-top: 20px;">
                        Experimenter: verify the file is saved before closing.
                    </p>
                    <button onclick="window.location.reload()"
                            style="margin-top:30px; padding:12px 24px; font-size:16px; background:#3498db;
                                   color:white; border:none; border-radius:6px; cursor:pointer;">
                        Start Next Participant
                    </button>
                </div>
            `;

            try {
                const backup = localStorage.getItem('trial_backup');
                if (backup) {
                    localStorage.setItem(`trial_backup_p${participantId}_completed`, backup);
                    localStorage.removeItem('trial_backup');
                }
            } catch(e) { console.warn(e); }
        }
    });

    // ---- 4. Preload ----
    const preload = {
        type: jsPsychPreload,
        images: [
            'assets/images/main.png',
            'assets/images/intro1.png',
            'assets/images/intro_seedling.png',
            'assets/images/intro_seedling_soil.png',
            'assets/images/intro_soil.png',
            'assets/images/soil.png',
            'assets/images/next_button.png',
            'assets/images/pink_vine.png',
            assignment.skin_1.vine_image,
            assignment.skin_1.fertilizer_image,
            assignment.skin_2.vine_image,
            assignment.skin_2.fertilizer_image
        ],
        audio: [],
        show_progress_bar: true,
        message: 'Getting the farm ready...',
        continue_after_error: true
    };

    // ---- 5. Build timeline ----
    const timeline = [];

    timeline.push(preload);
    timeline.push(...buildIntroTrials());
    timeline.push(buildFamiliarizationTrial());

    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="text-align:center; padding: 60px;">
                <div style="font-size:24px; margin-bottom:20px;">Great job!</div>
                <div style="font-size:22px;">Now let's grow more vines with a special fertilizer!</div>
            </div>
        `,
        choices: ['Start!'],
        button_html: (choice) => `<button class="jspsych-btn" style="font-size:22px; padding:16px 40px;">${choice}</button>`
    });

    timeline.push(...buildFunctionBlock(FUNCTIONS[assignment.function_1], assignment.skin_1, 1));

    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="text-align:center; padding: 80px;">
                <div style="font-size:30px; margin-bottom:20px;">🎉 You're doing great! 🎉</div>
                <div style="font-size:22px; margin-bottom:30px;">
                    Now you'll grow a different kind of vine with a different fertilizer.<br>
                    The rule might be totally different - pay close attention!
                </div>
            </div>
        `,
        choices: ['Keep going!'],
        button_html: (choice) => `<button class="jspsych-btn" style="font-size:22px; padding:16px 40px;">${choice}</button>`,
        data: { task: 'mid_session_break' }
    });

    timeline.push(...buildFunctionBlock(FUNCTIONS[assignment.function_2], assignment.skin_2, 2));

    jsPsych.run(timeline);

})();

// ---- CSV download helper ----

function downloadCSV(rows, filename) {
    if (!rows || rows.length === 0) { console.warn('No data to save'); return; }

    const allKeys = new Set();
    rows.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
    const keys = Array.from(allKeys);

    const escape = (val) => {
        if (val === null || val === undefined) return '';
        const s = String(val);
        return (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r'))
            ? '"' + s.replace(/"/g, '""') + '"'
            : s;
    };

    const csv = keys.map(escape).join(',') + '\n' +
        rows.map(row => keys.map(k => escape(row[k])).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}
