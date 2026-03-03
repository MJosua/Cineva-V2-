
import React, { useEffect, useRef } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import usePreferences from '@/hooks/usePreferences';
import { getDashboardSteps } from './tutorialSteps';
import { useAppSelector } from '@/hooks/useAppSelector';

export const TutorialManager: React.FC = () => {
    const { getPreference, setPreference, loading, fetchPreferences, invalidateCache, preferences } = usePreferences();
    const driverRef = useRef<any>(null);
    const { token, isAuthenticated } = useAppSelector((state) => state.auth);
    const lastToken = useRef<string | null>(token);

    // Effect to handle token changes (re-login or initial load)
    useEffect(() => {
        if (token && token !== lastToken.current) {
            console.log("🔄 [TutorialManager] Token changed/restored. Refreshing preferences...");
            invalidateCache();
            fetchPreferences(true);
            lastToken.current = token;
        }
    }, [token, invalidateCache, fetchPreferences]);

    useEffect(() => {
        // Guard 1: Must be authenticated with a token
        if (!isAuthenticated || !token) return;

        // Guard 2: Preferences must be finished loading
        if (loading) return;

        // Guard 3: Preferences must be populated (prevent race condition with empty default state)
        if (!preferences || Object.keys(preferences).length === 0) {
            console.log("⏳ [TutorialManager] Waiting for preferences to sync...");
            return;
        }

        // Check if tutorial is already completed
        const isTutorialCompleted = getPreference('tutorial', 'dashboard_onboarding', false);
        if (isTutorialCompleted) return;

        console.log("🚀 [TutorialManager] Starting dashboard tutorial...");

        // Initialize driver
        const driverObj = driver({
            showProgress: true,
            steps: getDashboardSteps(),
            onDestroyStarted: () => {
                if (!driverObj.hasNextStep()) {
                    driverObj.destroy();
                    // Tutorial is finished, save preference
                    setPreference('tutorial', 'dashboard_onboarding', true);
                    console.log("✅ [TutorialManager] Tutorial completed and saved.");
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

    }, [loading, getPreference, isAuthenticated, token, preferences, setPreference]);

    return null; // This component handles side-effects only
};
