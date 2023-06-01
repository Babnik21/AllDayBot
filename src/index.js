import { Client, GatewayIntentBits, Routes } from "discord.js";
import { config } from "dotenv";
import { REST } from '@discordjs/rest';
import { logger } from "./logger.js";
import { handleCommand } from "./handler.js";
import * as commands from './commands/index.js';
import { testCommand } from "./commands/test.js";

// Env variables
config();

const TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.BOT_CLIENT_ID;


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
        logger.verbose(`Pinged members in ${message.channel.name}`);
    }
    else if (message.author.id == '1105502167894343761') {
        message.channel.send('<@&1108778276601729176> :eyes:');
        logger.verbose(`Pinged members in ${message.channel.name}`);
    }
    else if (message.author.id == '1105502452087787520') {
        message.channel.send('<@&1108777943058096150> :eyes:');
        logger.verbose(`Pinged members in ${message.channel.name}`);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        // Kill client (if it goes mad lol)
        if (interaction.commandName === 'kill') {
            logger.debug('Executing command kill');
            client.destroy();
            logger.debug('Executed command kill');
            return;
        }

       await handleCommand(interaction);
    }
});

async function main() {

    try {

        // Refresh commands
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: Object.values(commands),
            // body: [ testCommand ]
        });

        // Run bot
        client.login(TOKEN);
    }
    catch (err) {
        logger.error(err);
    }
}

main();
