import { readFileSync, writeFile } from "fs";
import { logger } from "../logger.js";

export const registerUser = async (discordId, username) => {
    let res = await fetch(`https://www.otmnft.com/api/nflallday/user?username=${username}`, {
        method: "GET",
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    let obj = await res.json()
    if (obj.hasOwnProperty('error')) {
        return 'Invalid username!';
    }

    try {
        let usersObj = JSON.parse(readFileSync('src/resources/users.json', { encoding: 'utf-8' }));
        usersObj[discordId]= {
            otmUsername: obj.otmUsername,
            flowAddress: obj.flowAddress,
            tsUsername: obj.tsUsername,
            dapperUsername: obj.dapperUsername
        };
        writeFile('src/resources/users.json', JSON.stringify(usersObj), (err) => {
            if (err) {
                console.log(err);
            }
        })
        return 'Success!';
    }
    catch (err) {
        logger.info('Error when registring user ' + username);
        logger.error(err);
        return 'Unknown error occurred!';
    }

}
