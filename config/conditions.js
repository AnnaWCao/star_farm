// config/conditions.js
// Condition assignment and visual skin assignment.
//
// 3 conditions (between-subjects):
//   1. positive_linear + negative_linear
//   2. positive_linear + quadratic
//   3. positive_linear + exponential_growth
//
// Within each condition, 2 counterbalancing factors:
//   - Which function comes first (2 orders)
//   - Which visual skin (vine + fertilizer) goes with which function (2 assignments)
//
// Total cells: 3 conditions × 2 orders × 2 skin assignments = 12 cells
// For a balanced design, aim for N divisible by 12 (e.g., 24, 36, 48, 60, 72, 84).

const CONDITIONS = [
    {
        id: 1,
        name: "pos_linear_neg_linear",
        functions: ["positive_linear", "negative_linear"]
    },
    {
        id: 2,
        name: "pos_linear_quadratic",
        functions: ["positive_linear", "quadratic"]
    },
    {
        id: 3,
        name: "pos_linear_exponential",
        functions: ["positive_linear", "exponential_growth"]
    }
];

// Visual skins available. Each skin = a vine image + a fertilizer image.
// Add more skins here if you create more vine/fertilizer art.
const SKINS = [
    {
        id: "skin_A",
        vine_image: "assets/images/green_vine.png",
        fertilizer_image: "assets/images/green_fertilizer.png",
        fertilizer_name: "dax",
        vine_color_label: "green"
    },
    {
        id: "skin_B",
        vine_image: "assets/images/brown_vine.png",
        fertilizer_image: "assets/images/brown_fertilizer.png",
        fertilizer_name: "fep",
        vine_color_label: "brown"
    }
];

// Assign a condition and counterbalancing given a participant ID.
// Deterministic: same participant ID always gets same assignment.
//
// Optional overrides (set in the startup form):
//   forced_condition_id: 1, 2, or 3 — skips the auto assignment for condition
//   forced_order:        0 = function_1 first, 1 = function_2 first, null = auto
//
function assignCondition(participant_id, forced_condition_id = null, forced_order = null) {
    // 3 conditions × 2 orders × 2 skin assignments = 12 cells
    const cellIndex = (participant_id - 1) % 12;

    // Condition: use override if provided, otherwise derive from cell
    const conditionIdx = (forced_condition_id !== null)
        ? forced_condition_id - 1                          // 1-indexed → 0-indexed
        : Math.floor(cellIndex / 4);                       // 0, 1, or 2

    const orderIdx = (forced_order !== null)
        ? forced_order
        : Math.floor((cellIndex % 4) / 2);                // 0 or 1
    const skinIdx = cellIndex % 2;                         // 0 or 1 (always auto)

    const condition = CONDITIONS[conditionIdx];

    // Determine function order
    let functions_in_order;
    if (orderIdx === 0) {
        functions_in_order = [condition.functions[0], condition.functions[1]];
    } else {
        functions_in_order = [condition.functions[1], condition.functions[0]];
    }

    // Determine skin assignment
    // skinIdx 0: function_1 -> skin_A, function_2 -> skin_B
    // skinIdx 1: function_1 -> skin_B, function_2 -> skin_A
    let skins_in_order;
    if (skinIdx === 0) {
        skins_in_order = [SKINS[0], SKINS[1]];
    } else {
        skins_in_order = [SKINS[1], SKINS[0]];
    }

    return {
        participant_id: participant_id,
        condition_id: condition.id,
        condition_name: condition.name,
        cell_index: cellIndex,
        function_1: functions_in_order[0],
        function_2: functions_in_order[1],
        skin_1: skins_in_order[0],
        skin_2: skins_in_order[1],
        order_index: orderIdx,
        skin_index: skinIdx,
        condition_was_forced: forced_condition_id !== null,
        order_was_forced: forced_order !== null
    };
}
