import { Client, GatewayIntentBits, Routes } from "discord.js";
import { config } from "dotenv";
import { REST } from '@discordjs/rest';
import { helloCommand } from './commands/hello.js';
import { playbookCommand } from "./commands/playbook.js";
import { progressCommand } from "./commands/progress.js";
import { registerCommand } from "./commands/register.js";
import { solveChallengeCommand} from "./commands/solveChallenge.js";
import { playbooks, discordPlaybookProgress } from "./functions/fetchPlaybooks.js";
import { registerUser } from "./functions/registerUser.js";
import { getFlowAddress } from "./utils/getFlowAddress.js";
import { solveChallenge } from "./functions/solveChallenge.js";

// dotenv
config();
const TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.BOT_CLIENT_ID;
const CHANNEL_ID_AD = process.env.CHANNEL_ID_AD.toString(); 

const rest = new REST({ version: '10' }).setToken(TOKEN)

const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
]});

//client.login(TOKEN);
client.on('ready', () => console.log(`${client.user.username} has logged in!`));
client.on('messageCreate', (message) => console.log(message.content));

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'hello') {
            interaction.reply(`Hello <@${interaction.options.get('user').value}>`);
        }
        else if (interaction.commandName === 'playbook') {
            interaction.reply('Fetching playbook info. This might take a minute...');
            let msgs = await playbooks();
            for (let i = 0; i < msgs.length; i++) {
                client.channels.cache.get(CHANNEL_ID_AD).send(msgs[i]);
            }
        }
        else if (interaction.commandName === 'progress') {
            interaction.reply('Fetching progress. This might take a minute...');
            const pbId = interaction.options.get('id').value;
            const flowAddress = getFlowAddress(interaction.user.id);
            let msg = await discordPlaybookProgress(pbId - 1, flowAddress);
            client.channels.cache.get(CHANNEL_ID_AD).send(msg);
        }
        else if (interaction.commandName === 'register') {
            const username = interaction.options.get('username').value;
            let msg = await registerUser(interaction.user.id, username);
            interaction.reply(msg);
        }
        else if (interaction.commandName === 'solve') {
            interaction.reply('Solving challenge. This might take a minute...');
            const pbId = interaction.options.get('playbook-id').value;
            const chId = interaction.options.get('challenge-id').value;
            const flowAddress = getFlowAddress(interaction.user.id);
            let msg = await solveChallenge(pbId - 1, chId - 1, flowAddress);
            client.channels.cache.get(CHANNEL_ID_AD).send(msg);
        }
    }
});

async function main() {

    const commands = [
        helloCommand,
        playbookCommand,
        progressCommand,
        registerCommand,
        solveChallengeCommand
    ]

    try {
        console.log('Started refreshing bot\'s (/) commands...');
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
