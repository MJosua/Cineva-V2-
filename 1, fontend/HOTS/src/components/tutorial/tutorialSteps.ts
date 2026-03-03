
import { DriveStep } from "driver.js";

export const getDashboardSteps = (): DriveStep[] => [
    {
        element: "#non-existent-element-for-modal", // Virtual step for welcome modal
        popover: {
            title: "Welcome to HOTS! 👋",
            description: "Let's take a quick tour to get you set up.",
            align: "center",
        }
    },
    {
        element: "#sidebar-profile-btn",
        popover: {
            title: "Your Profile",
            description: "Click here to open your profile settings. You'll need to upload your digital signature here.",
            side: "top",
            align: "center",
        }
    },
    {
        element: "#profile-upload-signature-btn",
        popover: {
            title: "Upload Signature",
            description: "Click here to upload your digital signature. This is required for approving documents.",
            side: "left",
            align: 'center',
        }
    }
];
