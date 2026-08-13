export const feedbackStates = ["loading", "empty", "error", "success", "offline", "permission-denied"] as const;
export type FeedbackState = (typeof feedbackStates)[number];
export function getFeedbackMessage(state: FeedbackState): string { return { loading: "Loading Vehicle Care Log.", empty: "Nothing has been recorded yet.", error: "Something went wrong. Please try again.", success: "Your changes were saved.", offline: "You are offline. Local records remain available.", "permission-denied": "Permission is off. You can change it in Settings." }[state]; }
