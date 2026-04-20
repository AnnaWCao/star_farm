// trials/custom_plugins.js
// Two custom jsPsych plugins:
//   1. draggable-bar-response: for predicting vine length by dragging
//   2. draggable-seedling: for dragging seedling packet onto soil
//
// INPUT COMPATIBILITY:
// Uses a unified input system that captures mouse, touch, and pen input.
// Prefers pointer events where supported (all modern browsers and iPadOS 13+),
// falls back to paired mouse + touch listeners otherwise. Works on:
//   - Mouse click-and-drag on desktops (Mac, Windows, Linux, ChromeOS)
//   - Touch drag on iPads, iPhones, Android tablets
//   - Pen/stylus input (Apple Pencil, etc.)

// ============================================================
// UNIFIED INPUT HELPER
// ============================================================
// Attaches handlers that fire uniformly for mouse/touch/pen input.
// Returns { down, move, up } — all receive a normalized event with
// { clientX, clientY, pointerId, preventDefault(), originalEvent }.

function attachUnifiedInput(element, handlers) {
    const usePointerEvents = window.PointerEvent !== undefined;

    // Track the current active pointer/touch so we can ignore multi-touch
    // (important: kids resting palms on iPads often generate extra pointers)
    let activePointerId = null;

    // Normalize a native event into a common interface
    const normalizeEvent = (e) => {
        if (e.touches !== undefined) {
            // Touch event - use first changed touch
            const t = e.changedTouches[0] || e.touches[0];
            return {
                clientX: t.clientX,
                clientY: t.clientY,
                pointerId: t.identifier,
                originalEvent: e,
                preventDefault: () => e.preventDefault()
            };
        } else {
            // Mouse or pointer event
            return {
                clientX: e.clientX,
                clientY: e.clientY,
                pointerId: e.pointerId !== undefined ? e.pointerId : 0,
                originalEvent: e,
                preventDefault: () => e.preventDefault()
            };
        }
    };

    const cleanup = [];

    if (usePointerEvents) {
        // Modern path: pointer events handle all input types
        const onDown = (e) => {
            if (activePointerId !== null) return;  // already tracking one
            activePointerId = e.pointerId;
            try { element.setPointerCapture(e.pointerId); } catch(err) {}
            handlers.down(normalizeEvent(e));
        };
        const onMove = (e) => {
            if (e.pointerId !== activePointerId) return;
            handlers.move(normalizeEvent(e));
        };
        const onUp = (e) => {
            if (e.pointerId !== activePointerId) return;
            try { element.releasePointerCapture(e.pointerId); } catch(err) {}
            activePointerId = null;
            handlers.up(normalizeEvent(e));
        };

        element.addEventListener('pointerdown', onDown);
        element.addEventListener('pointermove', onMove);
        element.addEventListener('pointerup', onUp);
        element.addEventListener('pointercancel', onUp);

        cleanup.push(() => {
            element.removeEventListener('pointerdown', onDown);
            element.removeEventListener('pointermove', onMove);
            element.removeEventListener('pointerup', onUp);
            element.removeEventListener('pointercancel', onUp);
        });
    } else {
        // Fallback path: separate mouse + touch handlers
        // (only needed on very old browsers, but harmless to include)
        let isDown = false;

        const onMouseDown = (e) => {
            if (e.button !== 0) return;  // left click only
            isDown = true;
            handlers.down(normalizeEvent(e));
        };
        const onMouseMove = (e) => {
            if (!isDown) return;
            handlers.move(normalizeEvent(e));
        };
        const onMouseUp = (e) => {
            if (!isDown) return;
            isDown = false;
            handlers.up(normalizeEvent(e));
        };

        const onTouchStart = (e) => {
            if (activePointerId !== null) return;
            activePointerId = e.changedTouches[0].identifier;
            handlers.down(normalizeEvent(e));
        };
        const onTouchMove = (e) => {
            for (const t of e.changedTouches) {
                if (t.identifier === activePointerId) {
                    handlers.move(normalizeEvent(e));
                    break;
                }
            }
        };
        const onTouchEnd = (e) => {
            for (const t of e.changedTouches) {
                if (t.identifier === activePointerId) {
                    activePointerId = null;
                    handlers.up(normalizeEvent(e));
                    break;
                }
            }
        };

        element.addEventListener('mousedown', onMouseDown);
        // Mouse move/up attach to window so drag continues outside element
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        element.addEventListener('touchstart', onTouchStart, { passive: false });
        element.addEventListener('touchmove', onTouchMove, { passive: false });
        element.addEventListener('touchend', onTouchEnd);
        element.addEventListener('touchcancel', onTouchEnd);

        cleanup.push(() => {
            element.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            element.removeEventListener('touchstart', onTouchStart);
            element.removeEventListener('touchmove', onTouchMove);
            element.removeEventListener('touchend', onTouchEnd);
            element.removeEventListener('touchcancel', onTouchEnd);
        });
    }

    // Prevent context menu from interrupting drags
    element.addEventListener('contextmenu', (e) => e.preventDefault());

    return {
        destroy: () => cleanup.forEach(fn => fn())
    };
}


// ============================================================
// PLUGIN 1: draggable-bar-response
// ============================================================

var draggableBarResponse = (function(jspsych) {
    'use strict';

    const info = {
        name: 'draggable-bar-response',
        parameters: {
            input_value: { type: jspsych.ParameterType.FLOAT, default: 50 },
            true_output: { type: jspsych.ParameterType.FLOAT, default: 50 },
            fertilizer_image: { type: jspsych.ParameterType.STRING, default: '' },
            vine_image: { type: jspsych.ParameterType.STRING, default: '' },
            soil_image: { type: jspsych.ParameterType.STRING, default: 'assets/images/soil.png' },
            show_feedback: { type: jspsych.ParameterType.BOOL, default: true },
            prompt: { type: jspsych.ParameterType.HTML_STRING, default: '' },
            feedback_duration_ms: { type: jspsych.ParameterType.INT, default: 2500 },
            feedback_delay_ms: { type: jspsych.ParameterType.INT, default: 500 },
            progress_text: { type: jspsych.ParameterType.STRING, default: '' }
        }
    };

    class DraggableBarResponsePlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            const pxPerCm = 37.795 * SETTINGS.CM_CALIBRATION;
            const barWidthPx = SETTINGS.BAR_LENGTH_CM * pxPerCm;
            const barHeightPx = SETTINGS.BAR_HEIGHT_CM * pxPerCm;

            const fertFillPx = (trial.input_value / 100) * barWidthPx;

            display_element.innerHTML = `
                <div id="trial-container" style="max-width: ${barWidthPx + 100}px; margin: 40px auto;">
                    ${trial.progress_text ? `<div id="progress" style="text-align:right; font-size:14px; color:#888;">${trial.progress_text}</div>` : ''}

                    ${trial.prompt ? `<div id="prompt" style="font-size:22px; text-align:center; margin-bottom:20px;">${trial.prompt}</div>` : ''}

                    <!-- Fertilizer bar (input, static display) -->
                    <div style="margin-bottom: 30px;">
                        <div style="font-size:18px; margin-bottom:8px;">Fertilizer used:</div>
                        <div id="fertilizer-bar" style="
                            width: ${barWidthPx}px;
                            height: ${barHeightPx}px;
                            border: 2px solid #333;
                            background-color: #f5f5f5;
                            position: relative;
                            overflow: hidden;
                        ">
                            <div id="fertilizer-fill" style="
                                width: ${fertFillPx}px;
                                height: 100%;
                                background-image: url('${trial.fertilizer_image}');
                                background-repeat: repeat-x;
                                background-size: auto 100%;
                                background-color: #6fa8dc;
                            "></div>
                        </div>
                    </div>

                    <!-- Soil/vine bar (output, draggable) -->
                    <div style="margin-bottom: 30px;">
                        <div style="font-size:18px; margin-bottom:8px;">Your guess for vine length:</div>
                        <div id="soil-bar" class="interactive-drag-area" style="
                            width: ${barWidthPx}px;
                            height: ${barHeightPx}px;
                            border: 2px solid #333;
                            background-image: url('${trial.soil_image}');
                            background-size: 100% 100%;
                            position: relative;
                            overflow: hidden;
                            touch-action: none;
                            cursor: pointer;
                            user-select: none;
                            -webkit-user-select: none;
                            -webkit-touch-callout: none;
                        ">
                            <div id="vine-fill" style="
                                width: 0px;
                                height: 100%;
                                background-image: url('${trial.vine_image}');
                                background-repeat: no-repeat;
                                background-size: ${barWidthPx}px 100%;
                                background-position: left center;
                                pointer-events: none;
                            "></div>
                            <div id="feedback-marker" style="
                                display: none;
                                position: absolute;
                                top: 0;
                                height: 100%;
                                width: 4px;
                                background-color: #e74c3c;
                                pointer-events: none;
                            "></div>
                        </div>
                        <div style="font-size:14px; color:#888; margin-top:6px;">
                            Drag on the bar above to show how long the vine is.
                        </div>
                    </div>

                    <button id="ok-button" disabled style="
                        padding: 14px 40px;
                        font-size: 20px;
                        background-color: #27ae60;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        display: block;
                        margin: 20px auto;
                        opacity: 0.4;
                        touch-action: manipulation;
                    ">OK</button>
                </div>
            `;

            const soilBar = display_element.querySelector('#soil-bar');
            const vineFill = display_element.querySelector('#vine-fill');
            const okBtn = display_element.querySelector('#ok-button');
            const feedbackMarker = display_element.querySelector('#feedback-marker');

            let currentResponsePx = 0;
            let hasInteracted = false;
            const startTime = performance.now();
            let firstMoveTime = null;

            // Tracks last 5 positions for velocity analysis (could be saved later)
            const movementTrace = [];

            const updateVine = (clientX) => {
                const rect = soilBar.getBoundingClientRect();
                let x = clientX - rect.left;
                x = Math.max(0, Math.min(x, rect.width));
                vineFill.style.width = x + 'px';
                currentResponsePx = x;

                if (!hasInteracted) {
                    firstMoveTime = performance.now() - startTime;
                }
                hasInteracted = true;
                okBtn.disabled = false;
                okBtn.style.opacity = '1';

                // Log movement sample (throttled to roughly 20/sec)
                const now = performance.now();
                if (movementTrace.length === 0 ||
                    now - movementTrace[movementTrace.length - 1].t > 50) {
                    movementTrace.push({
                        t: Math.round(now - startTime),
                        x_units: (x / rect.width) * 100
                    });
                }
            };

            // Use the unified input helper
            const inputHandlers = attachUnifiedInput(soilBar, {
                down: (e) => {
                    e.preventDefault();
                    updateVine(e.clientX);
                },
                move: (e) => {
                    e.preventDefault();
                    updateVine(e.clientX);
                },
                up: (e) => {
                    // nothing specific on release; OK button handles confirmation
                }
            });

            // OK button confirmation
            const okHandler = () => {
                if (!hasInteracted) return;
                const rt = performance.now() - startTime;
                const responseUnits = (currentResponsePx / barWidthPx) * 100;

                // Disable further interaction
                soilBar.style.pointerEvents = 'none';
                okBtn.style.display = 'none';
                inputHandlers.destroy();

                if (trial.show_feedback) {
                    // After a short delay, animate the correct answer
                    setTimeout(() => {
                        const truePx = (trial.true_output / 100) * barWidthPx;

                        // Marker line at correct position
                        feedbackMarker.style.left = truePx + 'px';
                        feedbackMarker.style.display = 'block';

                        // Overlay showing true vine length
                        const feedbackVine = document.createElement('div');
                        feedbackVine.style.cssText = `
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 0px;
                            height: 100%;
                            background-image: url('${trial.vine_image}');
                            background-repeat: no-repeat;
                            background-size: ${barWidthPx}px 100%;
                            background-position: left center;
                            opacity: 0.55;
                            border-right: 3px solid #e74c3c;
                            pointer-events: none;
                        `;
                        soilBar.appendChild(feedbackVine);
                        setTimeout(() => {
                            feedbackVine.style.transition = 'width 800ms ease-out';
                            feedbackVine.style.width = truePx + 'px';
                        }, 50);

                        const fbText = document.createElement('div');
                        fbText.style.cssText = `
                            text-align: center;
                            font-size: 18px;
                            color: #e74c3c;
                            margin-top: 12px;
                        `;
                        fbText.textContent = 'The vine actually grew this long!';
                        display_element.querySelector('#trial-container').appendChild(fbText);

                        setTimeout(() => {
                            finishTrial(rt, responseUnits);
                        }, trial.feedback_duration_ms);
                    }, trial.feedback_delay_ms);
                } else {
                    finishTrial(rt, responseUnits);
                }
            };

            // Bind click AND touchend for OK button for max compatibility.
            // 'click' fires after a tap on all modern browsers, but we add
            // touchend with preventDefault to avoid any 300ms click delay.
            okBtn.addEventListener('click', okHandler);
            okBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                okHandler();
            });

            const finishTrial = (rt, responseUnits) => {
                const data = {
                    input_value: trial.input_value,
                    true_output: trial.true_output,
                    response_value: responseUnits,
                    response_raw_pixels: currentResponsePx,
                    bar_width_pixels: barWidthPx,
                    rt_ms: Math.round(rt),
                    first_move_rt_ms: firstMoveTime ? Math.round(firstMoveTime) : null,
                    n_movement_samples: movementTrace.length,
                    timestamp: new Date().toISOString()
                };
                display_element.innerHTML = '';
                this.jsPsych.finishTrial(data);
            };
        }
    }

    DraggableBarResponsePlugin.info = info;
    return DraggableBarResponsePlugin;
})(jsPsychModule);


// ============================================================
// PLUGIN 2: draggable-seedling
// ============================================================

var draggableSeedling = (function(jspsych) {
    'use strict';

    const info = {
        name: 'draggable-seedling',
        parameters: {
            seedling_image: { type: jspsych.ParameterType.STRING, default: 'assets/images/intro_seedling.png' },
            soil_image: { type: jspsych.ParameterType.STRING, default: 'assets/images/intro_soil.png' },
            prompt: { type: jspsych.ParameterType.HTML_STRING, default: 'Drag the seedling onto the soil.' },
            on_drop_success_html: { type: jspsych.ParameterType.HTML_STRING, default: '' },
            success_delay_ms: { type: jspsych.ParameterType.INT, default: 1200 }
        }
    };

    class DraggableSeedlingPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            display_element.innerHTML = `
                <div id="drag-container" style="position: relative; width: 800px; height: 500px;
                                                margin: 40px auto; user-select:none;">
                    <div id="prompt-text" style="text-align: center; font-size: 22px; margin-bottom: 20px;">
                        ${trial.prompt}
                    </div>
                    <img id="seedling" class="interactive-drag-area"
                         src="${trial.seedling_image}"
                         style="position: absolute; top: 70px; left: 50px; width: 150px; height: auto;
                                cursor: grab; touch-action: none; user-select: none;
                                -webkit-user-select:none; -webkit-touch-callout:none; z-index: 10;"
                         draggable="false">
                    <img id="soil-target"
                         src="${trial.soil_image}"
                         style="position: absolute; bottom: 40px; right: 50px; width: 350px; height: auto;
                                user-select: none; -webkit-user-select:none;"
                         draggable="false">
                </div>
            `;

            const seedling = display_element.querySelector('#seedling');
            const soilTarget = display_element.querySelector('#soil-target');
            const container = display_element.querySelector('#drag-container');

            const startTime = performance.now();
            let offsetX = 0;
            let offsetY = 0;
            let startPos = { left: '50px', top: '70px' };

            // Unified input handling
            const inputHandlers = attachUnifiedInput(seedling, {
                down: (e) => {
                    const rect = seedling.getBoundingClientRect();
                    offsetX = e.clientX - rect.left;
                    offsetY = e.clientY - rect.top;
                    seedling.style.cursor = 'grabbing';
                    e.preventDefault();
                },
                move: (e) => {
                    const containerRect = container.getBoundingClientRect();
                    const x = e.clientX - containerRect.left - offsetX;
                    const y = e.clientY - containerRect.top - offsetY;
                    seedling.style.left = x + 'px';
                    seedling.style.top = y + 'px';
                    e.preventDefault();
                },
                up: (e) => {
                    seedling.style.cursor = 'grab';

                    // Hit test: is seedling center overlapping soil target?
                    const seedRect = seedling.getBoundingClientRect();
                    const soilRect = soilTarget.getBoundingClientRect();
                    const seedCenterX = seedRect.left + seedRect.width / 2;
                    const seedCenterY = seedRect.top + seedRect.height / 2;

                    const onTarget = (
                        seedCenterX >= soilRect.left &&
                        seedCenterX <= soilRect.right &&
                        seedCenterY >= soilRect.top &&
                        seedCenterY <= soilRect.bottom
                    );

                    if (onTarget) {
                        // Snap to center of soil
                        const containerRect = container.getBoundingClientRect();
                        seedling.style.left = (soilRect.left - containerRect.left + soilRect.width/2 - seedRect.width/2) + 'px';
                        seedling.style.top = (soilRect.top - containerRect.top + soilRect.height/2 - seedRect.height/2) + 'px';
                        seedling.style.pointerEvents = 'none';
                        inputHandlers.destroy();

                        const rt = performance.now() - startTime;

                        if (trial.on_drop_success_html) {
                            setTimeout(() => {
                                display_element.innerHTML = trial.on_drop_success_html;
                            }, 300);
                        }

                        setTimeout(() => {
                            this.jsPsych.finishTrial({
                                dropped_on_target: true,
                                rt_ms: Math.round(rt),
                                timestamp: new Date().toISOString()
                            });
                        }, trial.success_delay_ms);
                    } else {
                        // Return to start position with animation
                        seedling.style.transition = 'left 300ms, top 300ms';
                        seedling.style.left = startPos.left;
                        seedling.style.top = startPos.top;
                        setTimeout(() => { seedling.style.transition = ''; }, 300);
                    }
                }
            });
        }
    }

    DraggableSeedlingPlugin.info = info;
    return DraggableSeedlingPlugin;
})(jsPsychModule);
