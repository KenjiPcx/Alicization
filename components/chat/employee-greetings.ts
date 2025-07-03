/**
 * A collection of employee greetings to randomly select from
 * when starting a conversation with an employee.
 */
export const employeeGreetings = [
    "How can I help you today?",
    "Good to see you! What can I assist you with?",
    "Ready to help with whatever you need!",
    "Hi there! What project are we tackling today?",
    "Looking forward to working with you. What's on your mind?",
    "At your service! What would you like me to help with?",
    "I'm here and ready to assist. What do you need?",
    "How may I be of assistance today?",
    "What challenges can I help you solve today?",
    "I'm available to help with any tasks you need. Where should we start?"
];

/**
 * Returns a random employee greeting
 */
export function getRandomEmployeeGreeting(): string {
    const randomIndex = Math.floor(Math.random() * employeeGreetings.length);
    return employeeGreetings[randomIndex];
} 