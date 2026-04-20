// config/settings.js
// Global settings for the Star Farm study.

const SETTINGS = {
    // Physical bar length on the iPad screen.
    // 28.3972 cm corresponds to 100 "units" in the function scale (0-100).
    BAR_LENGTH_CM: 28.3972,
    BAR_HEIGHT_CM: 2.5,

    // If the rendered bar on your specific iPad doesn't measure 28.4 cm,
    // adjust this multiplier. 1.0 = no correction.
    // To calibrate: run the study, measure the bar, adjust so
    //   rendered_cm = 28.3972 / measured_cm * old_calibration
    CM_CALIBRATION: 1.0,

    // Response feedback duration (ms) during training
    FEEDBACK_DURATION_MS: 2500,

    // Delay before feedback appears (for dramatic effect)
    FEEDBACK_DELAY_MS: 500,

    // Whether to show progress indicator ("Training trial 5 of 20")
    SHOW_PROGRESS: true,

    // Whether to back up each trial to localStorage (crash safety net)
    SAVE_PER_TRIAL: true,

    // Debug mode
    DEBUG: false,

    // Trial counts (for reference; actual counts driven by functions.js)
    N_TRAINING_TRIALS: 20,
    N_TESTING_INTERPOLATION: 4,
    N_TESTING_LOW_EXTRAP: 4,
    N_TESTING_HIGH_EXTRAP: 4,
};
