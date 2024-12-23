require("dotenv").config();

module.exports = {
    DISCORD_TOKEN: process.env.TEST_TOKEN,
    MONGODB_URI: process.env.MONGODB_URI,
    OWNER_ID: process.env.OWNER_ID,
    // PREMIUM_REPORT_WH: process.env.PREMIUM_REPORT_WH,
    // BUG_REPORT_WH: process.env.BUG_REPORT_WH,
    // SUGGESTION_REPORT_WH: process.env.SUGGESTION_REPORT_WH
    STEAM_API: process.env.STEAM_API_KEY,
    EPIC_API: process.env.EPIC_API_KEY,
};
