const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { STEAM_API, EPIC_API } = require('../configs/config');

let clientInstance = null; // Placeholder for the client

function setClient(client) {
    clientInstance = client; // Set the client instance
}

const platformRoles = {}; // { platform: { roleId: string, channelId: string } }

const apiConfigs = {
    steam: {
        url: 'https://steam2.p.rapidapi.com/search/free/page/1',
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
function scheduleNotification(channel, platform, roleId, genre = null) {
    if (!apiConfigs[platform]) return false;

    platformRoles[platform] = { roleId, channel };

    // Schedule task to check every 5 minutes
    setInterval(async () => {
        const games = await fetchFreeGames(platform, genre);
        if (games?.length) {
            postGameEmbeds(channel, games, platform, roleId);
        }
    }, 1 * 10 * 1000);

    return true;
}

/**
 * Fetches free games from the respective platform's API.
 */
async function fetchFreeGames(platform, genre = null) {
    const config = apiConfigs[platform];

    if (!config) {
        console.error(`Unsupported platform: ${platform}`);
        return [];
    }

    try {
        if (platform === 'steam') {
            // Use the Search endpoint to fetch multiple games
            const searchResponse = await axios.get('https://steam2.p.rapidapi.com/search/free/page/1', {
                headers: {
                    'x-rapidapi-key': STEAM_API,
                    'x-rapidapi-host': 'steam2.p.rapidapi.com',
                },
            });

            let games = searchResponse.data || [];
            if (!games.length) {
                console.log('No free games found.');
                return [];
            }

            // Filter games by genre if specified
            if (genre) {
                games = games.filter(game =>
                    game.genres?.some(g => g.toLowerCase() === genre.toLowerCase())
                );
            }

            if (!games.length) {
                console.log(`No games found for genre: ${genre}`);
                return [];
            }

            // Randomly pick a game from the filtered list
            const randomGame = games[Math.floor(Math.random() * games.length)];

            // Map the game into a usable format
            return [
                {
                    title: randomGame.title || 'Unknown Title',
                    description: randomGame.description || 'No description available.',
                    image: randomGame.imgUrl || 'https://via.placeholder.com/150', // Thumbnail image
                    link: randomGame.url || 'https://store.steampowered.com',
                    pricing: [{ name: 'Price', price: randomGame.price || 'Free' }],
                },
            ];
        } else if (platform === 'epic') {
            const response = await axios.get(config.url, {
                headers: config.headers,
                params: { country: 'US' },
            });

            let games = response.data || [];
            if (genre) {
                games = games.filter(game =>
                    game.categories?.some(c => c.toLowerCase() === genre.toLowerCase())
                );
            }

            if (!games.length) {
                console.log(`No games found for genre: ${genre}`);
                return [];
            }

            const randomGame = games[Math.floor(Math.random() * games.length)];

            return [
                {
                    title: randomGame.title,
                    description: randomGame.description || 'No description available.',
                    image: randomGame.keyImages?.find(img => img.type === 'Thumbnail')?.url || 'https://via.placeholder.com/150',
                    link: randomGame.productSlug
                        ? `https://store.epicgames.com/en-US/p/${randomGame.productSlug}`
                        : 'https://epicgames.com/store',
                    pricing: [{ name: 'Price', price: 'Free' }], // Epic Games free games
                },
            ];
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
        console.log('Client instance:', clientInstance);
        const channel = await clientInstance.channels.fetch(channelId); // Fetch the channel
        if (!channel.isTextBased()) {
            console.error(`Channel ${channelId} is not a text-based channel.`);
            return;
        }

        for (const game of games) {
            const pricingInfo = game.pricing ? game.pricing.map(price => `${price.name}: ${price.price}`).join('\n') : 'N/A';

            const embed = new EmbedBuilder()
                .setTitle(game.title)
                .setDescription(game.description)
                .setImage(game.image)
                .addFields(
                    {
                        name: 'Link',
                        value: game.link || 'N/A',
                    },
                    {
                        name: 'Platform',
                        // capitalize the first letter of the platform
                        value: platform.charAt(0).toUpperCase() + platform.slice(1),
                        inline: true,
                    },
                    {
                        name: 'Price',
                        value: pricingInfo,
                        inline: true,
                    }
                )
                .setURL(game.link)
                .setColor(0x00ff00)
                .setFooter({ text: `Platform: ${platform}` });

            await channel.send({ content: `<@&${roleId}>`, embeds: [embed] });
        }
    } catch (error) {
        console.error(`Failed to send game embeds to channel ${channelId}:`, error);
    }
}

module.exports = { setClient, scheduleNotification };
