// config/functions.js
// Function definitions: training inputs/outputs and testing inputs/outputs.
// All values on a 0-100 scale.

const FUNCTIONS = {

    positive_linear: {
        name: "positive_linear",
        label: "Positive Linear",
        formula: "y = 0.8x + 10",
        compute: function(x) { return 0.8 * x + 10; },
        training: {
            inputs:  [30, 34, 39, 43, 48, 52, 57, 61, 66, 70],
            outputs: [34.0, 37.2, 41.2, 44.4, 48.4, 51.6, 55.6, 58.8, 62.8, 66.0]
        },
        testing: {
            interpolation: {
                inputs:  [36, 45, 55, 64],
                outputs: [38.8, 46.0, 54.0, 61.2]
            },
            low_extrapolation: {
                inputs:  [5, 12, 20, 25],
                outputs: [14.0, 19.6, 26.0, 30.0]
            },
            high_extrapolation: {
                inputs:  [75, 82, 90, 97],
                outputs: [70.0, 75.6, 82.0, 87.6]
            }
        }
    },

    negative_linear: {
        name: "negative_linear",
        label: "Negative Linear",
        formula: "y = -0.8x + 90",
        compute: function(x) { return -0.8 * x + 90; },
        training: {
            inputs:  [30, 35, 40, 44, 47, 53, 56, 60, 65, 70],
            outputs: [66.0, 62.0, 58.0, 54.8, 52.4, 47.6, 45.2, 42.0, 38.0, 34.0]
        },
        testing: {
            interpolation: {
                inputs:  [36, 45, 55, 64],
                outputs: [61.2, 54.0, 46.0, 38.8]
            },
            low_extrapolation: {
                inputs:  [5, 12, 20, 25],
                outputs: [86.0, 80.4, 74.0, 70.0]
            },
            high_extrapolation: {
                inputs:  [75, 82, 90, 97],
                outputs: [30.0, 24.4, 18.0, 12.4]
            }
        }
    },

    quadratic: {
        name: "quadratic",
        label: "Quadratic (inverted U)",
        formula: "y = -0.036(x-50)^2 + 100",
        compute: function(x) { return -0.036 * Math.pow(x - 50, 2) + 100; },
        training: {
            inputs:  [30, 35, 40, 44, 47, 53, 56, 60, 65, 70],
            outputs: [85.60, 91.90, 96.40, 98.70, 99.68, 99.68, 98.70, 96.40, 91.90, 85.60]
        },
        testing: {
            interpolation: {
                inputs:  [38, 46, 50, 62],
                // Computed: -0.036*(x-50)^2 + 100
                outputs: [94.82, 99.42, 100.00, 94.82]
            },
            low_extrapolation: {
                inputs:  [5, 12, 20, 25],
                outputs: [27.00, 51.34, 67.60, 77.50]
            },
            high_extrapolation: {
                // Avoid x=97 where y=-3.08 (negative, outside bar)
                // Use values where y stays >= 0
                inputs:  [75, 80, 85, 90],
                outputs: [77.50, 67.60, 55.40, 42.40]
            }
        }
    },

    exponential_growth: {
        name: "exponential_growth",
        label: "Exponential Growth",
        formula: "y = 1.046^x + 10",
        compute: function(x) { return Math.pow(1.046, x) + 10; },
        training: {
            inputs:  [30, 35, 40, 44, 47, 53, 56, 60, 65, 70],
            outputs: [13.86, 14.84, 16.06, 17.26, 18.30, 20.88, 22.45, 24.90, 28.65, 33.36]
        },
        testing: {
            interpolation: {
                inputs:  [36, 45, 55, 64],
                // computed: 1.046^x + 10
                outputs: [15.52, 17.64, 22.82, 31.84]
            },
            low_extrapolation: {
                inputs:  [5, 12, 20, 25],
                outputs: [11.25, 11.72, 12.47, 13.08]
            },
            high_extrapolation: {
                // Keep high extrap where y stays on-bar (<=100)
                // y=100 at around x=82
                inputs:  [72, 75, 78, 80],
                outputs: [36.46, 41.68, 47.68, 52.18]
            }
        }
    }
};

// Helper: build a trial list for training (10 inputs, each shown 2x, randomized
// with the constraint that no input repeats consecutively, and trial 1 & 2 are
// one low-ish and one high-ish input to front-load the function shape).
function buildTrainingTrials(functionDef) {
    const inputs = functionDef.training.inputs;
    const outputs = functionDef.training.outputs;

    // Create all 20 trials (each input x 2)
    let pool = [];
    for (let i = 0; i < inputs.length; i++) {
        pool.push({ x: inputs[i], y: outputs[i] });
        pool.push({ x: inputs[i], y: outputs[i] });
    }

    // Front-load trials 1 and 2: one low, one high
    const lowInput = inputs[1];   // second-lowest
    const highInput = inputs[inputs.length - 2];  // second-highest
    const firstTrial = { x: lowInput, y: functionDef.compute(lowInput) };
    const secondTrial = { x: highInput, y: functionDef.compute(highInput) };

    // Remove one instance each from the pool
    let removed = 0;
    pool = pool.filter(t => {
        if (t.x === lowInput && removed === 0) { removed = 1; return false; }
        return true;
    });
    removed = 0;
    pool = pool.filter(t => {
        if (t.x === highInput && removed === 0) { removed = 1; return false; }
        return true;
    });

    // Shuffle remaining, reshuffling if consecutive same-input
    let shuffled = shuffleNoConsecutive(pool);

    return [firstTrial, secondTrial, ...shuffled];
}

// Helper: build testing trials (4 interpolation + 4 low + 4 high, fully interleaved)
function buildTestingTrials(functionDef) {
    const interp = functionDef.testing.interpolation;
    const lowExtrap = functionDef.testing.low_extrapolation;
    const highExtrap = functionDef.testing.high_extrapolation;

    let trials = [];
    for (let i = 0; i < interp.inputs.length; i++) {
        trials.push({
            x: interp.inputs[i],
            y: interp.outputs[i],
            trial_type: "interpolation"
        });
    }
    for (let i = 0; i < lowExtrap.inputs.length; i++) {
        trials.push({
            x: lowExtrap.inputs[i],
            y: lowExtrap.outputs[i],
            trial_type: "low_extrapolation"
        });
    }
    for (let i = 0; i < highExtrap.inputs.length; i++) {
        trials.push({
            x: highExtrap.inputs[i],
            y: highExtrap.outputs[i],
            trial_type: "high_extrapolation"
        });
    }

    return shuffle(trials);
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Shuffle with constraint: no consecutive identical x values
function shuffleNoConsecutive(arr) {
    for (let attempts = 0; attempts < 1000; attempts++) {
        const shuffled = shuffle(arr);
        const hasConsecutive = shuffled.some((t, i) => i > 0 && t.x === shuffled[i-1].x);
        if (!hasConsecutive) return shuffled;
    }
    console.warn("Could not avoid consecutive repeats after 1000 attempts");
    return shuffle(arr);
}
