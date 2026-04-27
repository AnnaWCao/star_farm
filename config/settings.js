// config/settings.js

// ╔══════════════════════════════════════════════════════════════╗
// ║  STUDY CONFIGURATION — change these settings between sessions ║
// ╚══════════════════════════════════════════════════════════════╝

// ── SWITCH 1: Stimuli set ──────────────────────────────────────
// 'green'  → green seed + vine, fertilizer called "Dax"
// 'brown'  → brown seed + vine, fertilizer called "Fep"
const STIMULI_SET = 'green';

// ── SWITCH 2: Function family to train and test this session ───
// 'positive_linear'    y = 0.8x + 10
// 'negative_linear'    y = −0.8x + 90
// 'quadratic'          y = −0.036(x−50)² + 100
// 'exponential_growth' y = 1.046^x + 10
const FUNCTION_TO_TEST = 'positive_linear';

// ── SWITCH 3: Training trial repetitions ──────────────────────
// Each unique input is shown this many times (randomized, no consecutive repeats).
// 10 unique inputs × TRAINING_REPS_PER_INPUT = total training trials.
// Default: 2 → 20 training trials total.
const TRAINING_REPS_PER_INPUT = 2;

// ── SWITCH 4: Training and testing input/output values ─────────
// Edit values directly in config/functions.js under:
//   FUNCTIONS['positive_linear'].training.inputs  / .outputs
//   FUNCTIONS['positive_linear'].testing.interpolation / .low_extrapolation / .high_extrapolation
// (Replace 'positive_linear' with whichever function is being tested.)

// ── Hardware / display (rarely changed) ───────────────────────
const SETTINGS = {
    BAR_LENGTH_CM:        28.3972,   // physical width of response bar on iPad
    BAR_HEIGHT_CM:        2.5,
    CM_CALIBRATION:       1.0,       // increase if bar measures longer than expected
    FEEDBACK_DURATION_MS: 2500,      // how long correct-vine feedback is shown
    FEEDBACK_DELAY_MS:    500,       // pause before feedback appears
    SHOW_PROGRESS:        true,      // show "Training trial X of Y" counter
    SAVE_PER_TRIAL:       true,      // backup each trial to localStorage
    DEBUG:                false,
};