// utils.js

const calculateDuration = (startTime) => {
    // Parse the start and end times into Date objects
    const start = new Date(startTime);
    const currentTime = new Date();
    // Calculate the difference in milliseconds
    const diff = currentTime - start;

    // Convert the difference to years, weeks, days, hours, minutes, and seconds
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const weeks = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 7));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Return the duration in the most appropriate unit
    if (years > 0) {
        return `${years} years`;
    } else if (weeks > 0) {
        return `${weeks} weeks`;
    } else if (days > 0) {
        return `${days} days`;
    } else if (hours > 0) {
        return `${hours} hours`;
    } else if (minutes > 0) {
        return `${minutes} minutes`;
    } else {
        return `${seconds} seconds`;
    }
}
;

module.exports = { calculateDuration };
