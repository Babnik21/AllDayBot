import { readFileSync } from "fs";

export const getFlowAddress = (discordId) => {
    let usersObj = JSON.parse(readFileSync('src/resources/users.json', {encoding: 'utf-8'}));
    return usersObj[discordId].flowAddress;
}