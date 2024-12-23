const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { client } = require('../bot.js');
const { STEAM_API, EPIC_API } = require('../configs/config');

const platformRoles = {}; // { platform: { roleId: string, channelId: string } }

const apiConfigs = {
    steam: {
        url: 'https://games-details.p.rapidapi.com/single_game/730',
        headers: {
            'x-rapidapi-key': STEAM_API,
            'x-rapidapi-host': 'games-details.p.rapidapi.com',
        },
    },
    epic: {
        url: 'https://epic-games-store-free-games.p.rapidapi.com/free',
        headers: {
            'x-rapidapi-key': EPIC_API,
            'x-rapidapi-host': 'epic-games-store-free-games.p.rapidapi.com',
        },
    },
};

/**
 * Schedules periodic notifications for a platform's free games.
 */
function scheduleNotification(channel, platform, roleId) {
    if (!apiConfigs[platform]) return false;

    platformRoles[platform] = { roleId, channel };

    // Schedule task to check every 5 minutes
    setInterval(async () => {
        const games = await fetchFreeGames(platform);
        if (games?.length) {
            postGameEmbeds(channel, games, platform, roleId);
        }
    }, 1 * 10 * 1000);

    return true;
}

/**
 * Fetches free games from the respective platform's API.
 */
async function fetchFreeGames(platform) {
    const config = apiConfigs[platform];
    try {
        const response = await axios.get(config.url, {
            headers: config.headers,
            params: platform === 'epic' ? { country: 'US' } : {},
        });

        if (platform === 'steam') {
            return [
                {
                    title: 'Counter-Strike: Global Offensive',
                    description: 'One of the most popular FPS games.',
                    image: 'https://upload.wikimedia.org/wikipedia/en/0/05/CSGOcoverMarch2020.jpg', // Placeholder
                    link: 'https://store.steampowered.com/app/730',
                },
            ]; // Replace this with dynamic Steam game parsing logic as per API response
        } else if (platform === 'epic') {
            return response.data.games.map(game => ({
                title: game.title,
                description: game.description || 'No description available.',
                image: game.thumbnail || 'https://via.placeholder.com/150', // Placeholder for missing thumbnails
                link: game.url,
            }));
        }
        return [];
    } catch (error) {
        console.error(`Error fetching free games for ${platform}:`, error);
        return [];
    }
}

/**
 * Posts embeds for each free game to a Discord channel.
 */
async function postGameEmbeds(channelId, games, platform, roleId) {
    try {
        console.log('Client instance:', client);
        const channel = await client.channels.fetch(channelId); // Fetch the channel
        if (!channel.isTextBased()) {
            console.error(`Channel ${channelId} is not a text-based channel.`);
            return;
        }

        for (const game of games) {
            const embed = new EmbedBuilder()
                .setTitle(game.title)
                .setDescription(game.description)
                .setImage(game.image)
                .setURL(game.link)
                .setColor(0x00ff00)
                .setFooter({ text: `Platform: ${platform}` });

            await channel.send({ content: `<@&${roleId}>`, embeds: [embed] });
        }
    } catch (error) {
        console.error(`Failed to send game embeds to channel ${channelId}:`, error);
    }
}

module.exports = { scheduleNotification };
