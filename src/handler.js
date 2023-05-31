// import { Client } from "discord.js";
import { logger } from "./logger.js";
import { handleHello } from "./handlers/helloHandler.js";
import { handlePlaybook } from "./handlers/playbookHandler.js";
import { handleProgress } from "./handlers/progressHandler.js";
import { handleSolve } from "./handlers/solveHandler.js";
import { handleRegister } from "./handlers/registerHandler.js";
import { handleGainers } from "./handlers/gainersHandler.js";
import { handleAddRole } from "./handlers/addRoleHandler.js";
import { handleRemoveRole } from "./handlers/removeRoleHandler.js";
import { handleTest } from "./handlers/testHandler.js";

export const handleCommand = async (interaction) => {
    logger.debug(`Executing command ${interaction.commandName}`)
    try {
        switch (interaction.commandName) {
            case 'hello':
                await handleHello(interaction);
                break;
            case 'playbook':
                await handlePlaybook(interaction);
                break;
            case 'progress':
                await handleProgress(interaction);
                break;
            case 'solve':
                await handleSolve(interaction);
                break;
            case 'register':
                await handleRegister(interaction);
                break;
            case 'gainers':
                await handleGainers(interaction);
                break;
            case 'addrole':
                await handleAddRole(interaction);
                break;
            case 'removerole':
                await handleRemoveRole(interaction);
                break;
            case 'test':
                await handleTest(interaction);
                break;
            default:
                logger.info(`Unrecognized command ${interaction.commandName}.`)
        }
    }
    catch (err) {
        console.log(err);
        logger.error(err);
        logger.debug(`Error executing command ${interaction.commandName}`);
        return;
    }
    logger.debug(`Executed command ${interaction.commandName}`)
}