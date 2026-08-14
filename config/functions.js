// ================================================================
//  FUNCTION-LEARNING STIMULI  —  KIDS VERSION
//  Predictor range 1-100.  Training region [20, 80].
//  Training points (7): [20, 30, 40, 50, 60, 70, 80]
//  Presentation: 4 ascending passes (low->high), = 28 training trials per function.
//  Testing (12, SHARED with the other population): 3 lower-tail + 6 interpolation + 3 upper-tail,
//    [4, 11, 18, 28, 36, 44, 56, 64, 72, 82, 89, 96]
//    All test items are novel to BOTH training grids and symmetric about 50.
//    >> Present test items in a NEW random order per participant (do not use the listed order).
//  Outputs computed from exact inputs, rounded to 2 dp.
// ================================================================

const FUNCTIONS = {

    1: {
        name: "positive_linear",
        label: "Positive Linear",
        formula: "y = 0.8x + 10",
        training: {  // 6 pts x 4 upward sweeps
            inputs:  [25.00, 35.00, 45.00, 55.00, 65.00, 75.00, 
                25.00, 35.00, 45.00, 55.00, 65.00, 75.00, 
                25.00, 35.00, 45.00, 55.00, 65.00, 75.00],
            outputs: [30.00, 38.00, 46.00, 54.00, 62.00, 70.00, 
                30.00, 38.00, 46.00, 54.00, 62.00, 70.00, 
                30.00, 38.00, 46.00, 54.00, 62.00, 70.00]
        },
        testing: {  // 9 pts; randomize order per participant
            inputs:  [5.00, 13.00, 21.00, 30.00, 50.00, 70.00, 79.00, 87.00, 95.00],
            outputs: [14.00, 20.40, 26.80, 34.00, 50.00, 66.00, 73.20, 79.60, 86.00]
        }
    },

    2: {
        name: "negative_linear",
        label: "Negative Linear",
        formula: "y = -0.8x + 90",
        training: {  // 6 pts x 4 upward sweeps
            inputs:  [25.00, 35.00, 45.00, 55.00, 65.00, 75.00, 
                25.00, 35.00, 45.00, 55.00, 65.00, 75.00, 
                25.00, 35.00, 45.00, 55.00, 65.00, 75.00],
            outputs: [70.00, 62.00, 54.00, 46.00, 38.00, 30.00, 
                70.00, 62.00, 54.00, 46.00, 38.00, 30.00, 
                70.00, 62.00, 54.00, 46.00, 38.00, 30.00]
        },
        testing: {  // 9 pts; randomize order per participant
            inputs:  [5.00, 13.00, 21.00, 30.00, 50.00, 70.00, 79.00, 87.00, 95.00],
            outputs: [86.00, 79.60, 73.20, 66.00, 50.00, 34.00, 26.80, 20.40, 14.00]
        }
    },

    3: {
        name: "quadratic",
        label: "Quadratic (inverted U)",
        formula: "y = -0.036(x-50)^2 + 100",
        training: {  // 6 pts x 4 upward sweeps
            inputs:  [25.00, 35.00, 45.00, 55.00, 65.00, 75.00, 
                25.00, 35.00, 45.00, 55.00, 65.00, 75.00, 
                25.00, 35.00, 45.00, 55.00, 65.00, 75.00],
            outputs: [77.50, 91.90, 99.10, 99.10, 91.90, 77.50, 
                77.50, 91.90, 99.10, 99.10, 91.90, 77.50, 
                77.50, 91.90, 99.10, 99.10, 91.90, 77.50]
        },
        testing: {  // 9 pts; randomize order per participant
            inputs:  [5.00, 13.00, 21.00, 30.00, 50.00, 70.00, 79.00, 87.00, 95.00],
            outputs: [27.10, 50.72, 69.72, 85.60, 100.00, 85.60, 69.72, 50.72, 27.10]
        }
    },

    4: {
        name: "exponential_growth",
        label: "Exponential Growth",
        formula: "y = 1.046^x + 10",
        training: {  // 6 pts x 4 upward sweeps
            inputs:  [25.00, 35.00, 45.00, 55.00, 65.00, 75.00, 
                25.00, 35.00, 45.00, 55.00, 65.00, 75.00, 
                25.00, 35.00, 45.00, 55.00, 65.00, 75.00],
            outputs: [13.08, 14.83, 17.57, 21.86, 28.60, 39.17, 
                13.08, 14.83, 17.57, 21.86, 28.60, 39.17, 
                13.08, 14.83, 17.57, 21.86, 28.60, 39.17]
        },
        testing: {  // 9 pts; randomize order per participant
            inputs:  [5.00, 13.00, 21.00, 30.00, 50.00, 70.00, 79.00, 87.00, 95.00],
            outputs: [11.25, 11.79, 12.57, 13.85, 19.48, 33.29, 44.91, 60.03, 81.70]
        }
    }

};