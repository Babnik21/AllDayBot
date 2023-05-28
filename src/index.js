import { Client, GatewayIntentBits, Routes } from "discord.js";
import { config } from "dotenv";
import { REST } from '@discordjs/rest';
import { helloCommand } from './commands/hello.js';
import { playbookCommand } from "./commands/playbook.js";
import { progressCommand } from "./commands/progress.js";
import { registerCommand } from "./commands/register.js";
import { solveChallengeCommand} from "./commands/solveChallenge.js";
import { gainersCommand } from "./commands/gainers.js";
import { addRoleCommand } from "./commands/addrole.js";
import { removeRoleCommand } from "./commands/removerole.js";
import { killCommand } from "./commands/kill.js";
import { playbooks, discordPlaybookProgress } from "./functions/fetchPlaybooks.js";
import { gainers } from "./functions/gainers.js";
import { registerUser } from "./functions/registerUser.js";
import { getFlowAddress } from "./utils/getFlowAddress.js";
import { solveChallenge } from "./functions/solveChallenge.js";
import { logger } from "./functions/logger.js";

import { testCommand } from "./commands/test.js";
import { test } from "./functions/test.js";

// dotenv
config();
const TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.BOT_CLIENT_ID;
// const CHANNEL_ID_AD = process.env.CHANNEL_ID_AD.toString();
// const LOGGER_TOKEN = process.env.LOGGER_TOKEN.toString();

const rest = new REST({ version: '10' }).setToken(TOKEN);


const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
]});

client.on('ready', () => console.log(`${client.user.username} has logged in!`));

// Tagging roles on announcement messages
client.on('messageCreate', (message) => {
    if (message.channel.id == '1105501950168023222' && message.author.id != '1105904080410378340') {
        message.channel.send('<@&1108778702365532182> :eyes:');
    }
    else if (message.author.id == '1105502167894343761') {
        message.channel.send('<@&1108778276601729176> :eyes:');
    }
    else if (message.author.id == '1105502452087787520') {
        message.channel.send('<@&1108777943058096150> :eyes:');
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {

        // Hello command
        if (interaction.commandName === 'hello') {
            interaction.reply('Hello!');
        }

        // Force killing client
        else if (interaction.commandName === 'kill') {
            logger.debug('Executing command kill');
            client.destroy();
        }

        // Test command
        else if (interaction.commandName == 'embed') {
            try {
                interaction.deferReply();
                const flowAddress = getFlowAddress(interaction.user.id);
                let embeds = await test(0, 6, flowAddress);
                interaction.editReply({ embeds: embeds });
            }
            catch (err) {
                logger.error(err);
                interaction.editReply('Error occurred.')
            }
        }

        // Displaying playbook information
        else if (interaction.commandName === 'playbook') { 
            logger.debug('Executing command playbook');
            try {
                interaction.deferReply();
                let embeds = await playbooks();
                interaction.editReply({ embeds: embeds });
                logger.debug('Executed command playbook');
            }
            catch (err) {
                logger.error(err);
                interaction.editReply('An unknown error occurred.');
                logger.debug('Error executing command playbook');
            }
        }

        // Displaying progress toward playbook
        else if (interaction.commandName === 'progress') {
            logger.debug('Executing command progress');
            try {
                interaction.deferReply();
                const pbId = interaction.options.get('id').value;
                const flowAddress = getFlowAddress(interaction.user.id);
                let embeds = await discordPlaybookProgress(pbId - 1, flowAddress);
                interaction.editReply({ embeds: embeds });
                logger.debug('Executed command progress');
            }
            catch (err) {
                logger.error(err);
                interaction.editReply('An unknown error occurred.');
                logger.debug('Error executing command progress');
            }
        }

        // Solving challenges
        else if (interaction.commandName === 'solve') {
            logger.debug('Executing command solve');
            try {
                interaction.deferReply();
                const pbId = interaction.options.get('playbook-id').value;
                const chId = interaction.options.get('challenge-id').value;
                const flowAddress = getFlowAddress(interaction.user.id);
                let embeds = await solveChallenge(pbId - 1, chId - 1, flowAddress);
                interaction.editReply({ embeds: embeds });
                logger.debug('Executed command solve');
            }
            catch (err) {
                logger.error(err);
                interaction.editReply('Unknown error occurred.');
                logger.debug('Error executing command solve');
            }
        }

        // Adding flow addresses and stuff
        else if (interaction.commandName === 'register') {
            logger.debug('Executing command register');
            try {
                const username = interaction.options.get('username').value;
                let msg = await registerUser(interaction.user.id, username);
                interaction.reply(msg);
                logger.debug('Executed command register');
            }
            catch (err) {
                logger.error(err);
                logger.debug('Error executing command register');
            }
        }

        // Gainers
        else if (interaction.commandName === 'gainers') {
            logger.debug('Executing command gainers');
            try {
                interaction.deferReply()
                let interval = interaction.options.get('interval').value;
                let embeds = await gainers(interaction.user.id, interval);
                interaction.editReply({ embeds: embeds });
                logger.debug('Executed command gainers');
            }
            catch (err) {
                logger.error(err);
                logger.debug('Error executing command gainers');
                interaction.editReply('Unknown error occurred.');
            }
        }

        // Roles
        else if (interaction.commandName === 'addrole') {
            logger.debug('Executing command addrole');
            try {
                let role = interaction.options.getRole('role');
                let userId = interaction.user.id;
                let member = await interaction.guild.members.fetch(userId);
                if (member.roles.cache.has(role.id)) {
                    interaction.reply('You already have this role!');
                }
                else {
                    try {
                        await interaction.guild.members.cache.get(userId).roles.add(role);
                        interaction.reply('Successfully assigned role!');
                    }
                    catch (err) {
                        logger.error(err);
                    }
                }

                logger.debug('Executed command addrole')
            }
            catch (err) {
                logger.error(err);
                logger.debug('Error executing command addrole');
            }
        }
        else if (interaction.commandName == 'removerole') {
            logger.debug('Executing command removerole');
            try {
                let role = interaction.options.getRole('role');
                let userId = interaction.user.id;
                let member = await interaction.guild.members.fetch(userId);
                if (!member.roles.cache.has(role.id)) {
                    interaction.reply('You don\'t have this role!');
                }
                else {
                    try {
                        await interaction.guild.members.cache.get(userId).roles.remove(role);
                        interaction.reply('Successfully removed role!');
                    }
                    catch (err) {
                        logger.error(err);
                    }
                }

                logger.debug('Executed command removerole')
            }
            catch (err) {
                logger.error(err);
                logger.debug('Error executing command removerole');
            }
        }
    }
});

async function main() {

    const commands = [
        helloCommand,
        playbookCommand,
        progressCommand,
        registerCommand,
        solveChallengeCommand,
        gainersCommand,
        addRoleCommand,
        removeRoleCommand,
        killCommand
        // testCommand
    ]

    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands, 
        });
        client.login(TOKEN);
    }
    catch (err) {
        console.log(err);
    }
}

main();
