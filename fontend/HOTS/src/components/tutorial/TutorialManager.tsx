
import React, { useEffect, useRef } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import usePreferences from '@/hooks/usePreferences';
import { getDashboardSteps } from './tutorialSteps';

export const TutorialManager: React.FC = () => {
    const { getPreference, setPreference, loading } = usePreferences();
    const driverRef = useRef<any>(null);

    useEffect(() => {
        // Wait for preferences to load
        if (loading) return;

        // Check if tutorial is already completed
        const isTutorialCompleted = getPreference('tutorial', 'dashboard_onboarding', false);
        if (isTutorialCompleted) return;

        // Initialize driver
        const driverObj = driver({
            showProgress: true,
            steps: getDashboardSteps(),
            onDestroyStarted: () => {
                if (!driverObj.hasNextStep()) {
                    driverObj.destroy();
                    // Tutorial is finished, save preference
                    setPreference('tutorial', 'dashboard_onboarding', true);
                }
            },
            onPopoverRender: (popover, { config, state }) => {
                const firstButton = popover.footerButtons[0];
                if (firstButton) {
                    firstButton.style.border = "1px solid #e2e8f0";
                    firstButton.style.borderRadius = "6px";
                }
                // Custom handling for the "Click" step
                if (state.activeIndex === 1) { // The Profile Button Step
                    const nextButton = popover.nextButton;
                    if (nextButton) nextButton.innerText = "I've clicked it";

                    // Also listen for potential click on the target itself to advance
                    // Safe access to element from step definition
                    const activeStep = state?.activeStep as any;
                    const elementSelector = activeStep?.element;

                    if (elementSelector && typeof elementSelector === 'string') {
                        const target = document.querySelector(elementSelector);
                        if (target) {
                            const clickHandler = () => {
                                // Give modal time to open
                                setTimeout(() => {
                                    driverObj.moveNext();
                                }, 500);
                                target.removeEventListener('click', clickHandler);
                            };
                            target.addEventListener('click', clickHandler);
                        }
                    }
                }
            },
            onHighlightStarted: (element) => {
                // If we are targeting the upload button, check if modal is open
                if (element && element.id === 'profile-upload-signature-btn') {
                    // Check if visible, if not, wait/retry or just let driver handle it (it waits by default)
                }
            }
        });

        // Start the tour
        // Use setTimeout to ensure DOM is fully ready
        const timer = setTimeout(() => {
            driverObj.drive();
        }, 1500);

        driverRef.current = driverObj;

        // Cleanup
        return () => {
            clearTimeout(timer);
            if (driverRef.current) {
                driverRef.current.destroy();
            }
        };

    }, [loading, getPreference]); // removed setPreference from dependencies to avoid loop, though it's stable

    // We need to listen to the "Finish" event to save preference
    // Since driver.js doesn't have a simple "onFinish" in current types sometimes, 
    // we can use the onDestroy logic or wrap the steps.
    // Actually, checking `driverObj.hasNextStep()` in `onDestroyStarted` is a good way.

    return null; // This component handles side-effects only
};
