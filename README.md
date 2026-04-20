# Star Farm — Children's Function Learning Study

Browser-based experiment hosted on GitHub Pages. Runs on iPad (touch), desktop
(mouse), or any modern browser. Data saved as CSV downloaded to the device
running the experiment.

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g., `star-farm-study`).
2. Copy all files from this folder into the repo, preserving folder structure.
3. Commit and push to the `main` branch.
4. In the repo on github.com: **Settings** → **Pages** → under "Build and
   deployment", set **Source** to "Deploy from a branch", **Branch** to `main`
   and folder to `/ (root)`. Click **Save**.
5. Wait ~1 minute. Your experiment URL will be:
   `https://<your-username>.github.io/<repo-name>/`
6. Open that URL in any browser to run the study.

GitHub Pages is free for public repos. For private repos, you need a Pro
account, or use a different static host like Netlify or Vercel (same workflow).

## Running a Session

1. Open the study URL on the device (iPad or laptop).
2. Fill in the experimenter startup form:
   - Participant ID (integer, e.g., 1, 2, 3, ...)
   - Age (years, decimals allowed, e.g., 5.25)
   - Sex (optional)
   - Experimenter notes (optional)
3. Click "Start Session" → hand the device to the child.
4. At session end, a CSV file is automatically downloaded to the device's
   Downloads folder. Filename format:
   `star-farm_p001_2026-04-20T15-30-00.csv`
5. Click "Start Next Participant" to reload for the next child (or close).

## iPad Setup Before First Session

1. Turn off auto-lock: **Settings** → **Display & Brightness** → **Auto-Lock** →
   **Never** (while plugged in) or 15 min.
2. Disable Safari autofill and suggestions: **Settings** → **Safari** →
   **AutoFill** → turn off all.
3. Enable Guided Access: **Settings** → **Accessibility** → **Guided Access** →
   on. Set a passcode. Then on the study URL, triple-click the side button to
   lock the child into the tab.
4. Test that CSV download works: run a quick pilot session with `?pid=999`.
   After completion, check the Files app → Downloads folder for the CSV. If
   the download is blocked on iPad, see "iPad download troubleshooting" below.
5. Calibrate bar length: open the experiment to a trial, hold a ruler to the
   rendered bar. If it's not 28.4 cm, edit `config/settings.js`:
   `CM_CALIBRATION: 28.3972 / measured_cm_value`.

## Input Compatibility

The study works equally with mouse and touch because the custom plugins use
unified input handling:
- **Pointer events** (modern API) handle mouse, touch, and stylus in one code
  path on all current browsers including iPad Safari 13+.
- **Fallback path** for older browsers uses paired `mousedown`/`touchstart`
  listeners so input still works even if pointer events are unavailable.
- **Multi-touch protection** ignores extra pointers (e.g., when a child rests
  their palm on the iPad while dragging with their finger).

Tested with: mouse on macOS Chrome/Safari/Firefox; touch on iPad Safari;
touchpad tap-drag on macOS.

## iPad Download Troubleshooting

Safari on iPad sometimes shows a "Download" prompt rather than auto-saving.
If this happens:
1. Tap the prompt to confirm the download.
2. Files will save to **Files** app → **On My iPad** → **Downloads**, or
   **iCloud Drive** → **Downloads**, depending on your Files settings.
3. AirDrop the CSV to your laptop, or upload to a shared drive.

Alternative: run the study on a laptop with a touchscreen (Surface, Chromebook,
some Lenovo) to get desktop download behavior with touch input.

## File Structure

```
star-farm-study/
├── index.html                    # entry point (just HTML + script imports)
├── experiment.js                 # main timeline + startup form + CSV save
├── config/
│   ├── settings.js               # bar size, timing, flags
│   ├── functions.js              # function formulas + data points
│   └── conditions.js             # condition assignment, counterbalancing
├── trials/
│   ├── custom_plugins.js         # draggable bar + draggable seedling plugins
│   ├── intro_trials.js           # welcome story sequence
│   ├── familiarization.js        # water-the-seedling trial
│   ├── training_trial.js         # training + testing block factory
│   └── testing_trial.js          # reserved for future expansion
├── css/
│   └── styles.css
├── assets/
│   ├── images/
│   ├── audio/     (optional)
│   └── videos/    (optional)
└── README.md
```

## Data Output Columns

Every CSV has one row per trial, with these columns (selected):

**Participant metadata** (same on every row):
- `participant_id`, `age_years`, `sex`, `experimenter_notes`
- `condition_id` (1/2/3), `condition_name` (pos_linear_quadratic, etc.)
- `cell_index` (0–11), `function_order_index`, `skin_assignment_index`
- `function_1_name`, `function_2_name`, `skin_1_id`, `skin_2_id`
- `session_start`, `user_agent`

**Trial-level fields**:
- `task` (intro, familiarization, function_intro, training, testing, block_break, mid_session_break)
- `block` (training/testing), `function_type`, `function_index` (1 or 2)
- `trial_number_within_block`, `test_trial_type` (interpolation / low_extrapolation / high_extrapolation)
- `input_value` (x, 0–100), `true_output` (y, 0–100)
- `response_value` (child's answer, 0–100), `response_raw_pixels`, `bar_width_pixels`
- `rt_ms` (total response time), `first_move_rt_ms` (time to first drag)
- `n_movement_samples`, `timestamp`

Note: intro and transition trials don't have all these fields. Analyze by
filtering on `task == 'training'` or `task == 'testing'`.

## Crash Recovery

Every trial is also backed up to browser `localStorage` as it completes.
If a session crashes before the final CSV downloads:
1. On the same device, open Safari/Chrome dev tools (Settings → Safari →
   Advanced → Web Inspector on iPad, then connect to Mac Safari).
2. Navigate to Storage → Local Storage for the study domain.
3. Copy the `trial_backup` key's value (JSON array).
4. Manually convert to CSV using any online JSON-to-CSV tool, or ask a
   collaborator to help parse it.

## What Needs To Be Added Before Running Participants

1. **Image assets** (drop into `assets/images/`):
   - `main.png` — farm scene (used as welcome background)
   - `intro1.png` — scene introducing the seedling concept
   - `intro_seedling.png` — seedling packet
   - `intro_seedling_soil.png` — soil with seedling planted
   - `intro_soil.png` — empty soil
   - `soil.png` — soil bar used as trial background
   - `next_button.png` — arrow button
   - `pink_vine.png` — familiarization vine
   - `vine1.png` — vine for skin A (e.g., green)
   - `vine2.png` — vine for skin B (e.g., pink or purple)
   - `fertilizer_a.png` — dax (a nonce-word fertilizer, e.g., blue)
   - `fertilizer_b.png` — fep (a different-colored fertilizer)
2. **Audio files** (optional — currently commented out in `experiment.js`):
   If you want audio narration, record `welcome.mp3`, `intro_narrative.mp3`,
   `receive_seedling.mp3` and uncomment the lines in `experiment.js` and
   `intro_trials.js`. Otherwise the experimenter reads text aloud.
3. **Calibration**: measure the rendered bar on your iPad and update
   `CM_CALIBRATION` in `config/settings.js` if needed.

## Common Customizations

- **Change number of training trials**: edit `buildTrainingTrials()` in
  `config/functions.js` and update the training inputs array.
- **Change bar physical length**: edit `BAR_LENGTH_CM` in `config/settings.js`.
  All pixel calculations automatically re-scale.
- **Add more skins**: push additional entries to the `SKINS` array in
  `config/conditions.js`, then update `assignCondition` to round-robin through
  them. Consider adjusting the cell-index math if you change the number of
  skins.
- **Disable feedback during training**: set `show_feedback: false` in
  `trials/training_trial.js`.
