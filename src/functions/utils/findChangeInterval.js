// Deterimnes correct time interval for expected loss calculation
export const findChangeInterval = (startDate) => {
    let timeSinceChallengeStart = (Date.now() - Date.parse(startDate)) / 1000;  // In seconds
    if (timeSinceChallengeStart < 14400) return "change4" // Less than 4 hours since challenge start
    if (timeSinceChallengeStart < 28800) return "change8" // Less than 8 hours since challenge start
    if (timeSinceChallengeStart < 3600 * 24) return "change24" // Less than 24 hours since challenge start
    return "change7d" // More than 24 hours since challenge start
}