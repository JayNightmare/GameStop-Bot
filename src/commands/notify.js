const { SlashCommandBuilder } = require('discord.js');
const { scheduleNotification } = require('../services/freeGamesService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notify')
        .setDescription('Set up notifications for free games on a platform')
        .addStringOption(option =>
            option.setName('platform')
                .setDescription('The platform (e.g., Steam, Epic Games)')
                .setRequired(true)
                .addChoices(
                    { name: 'Steam', value: 'steam' },
                    { name: 'Epic Games', value: 'epic' }
                ))
        .addStringOption(option =>
            option.setName('genre')
                .setDescription('The genre of the game (optional)')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to ping for notifications')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to post notifications in')
                .setRequired(true)),
    async execute(interaction) {
        const platform = interaction.options.getString('platform').toLowerCase();
        const genre = interaction.options.getString('genre');
        const role = interaction.options.getRole('role');
        const channelId = interaction.options.getChannel('channel').id;

        // Schedule notifications
        const success = scheduleNotification(channelId, platform, role.id, genre);

        if (success) {
            await interaction.reply(
                `Notifications for ${platform} free games${genre ? ` in genre ${genre}` : ''} set up successfully! <@&${role.id}> will be notified.`
            );
        } else {
            await interaction.reply(`Failed to set up notifications for ${platform}. Check if the platform is supported.`);
        }
    },
};
