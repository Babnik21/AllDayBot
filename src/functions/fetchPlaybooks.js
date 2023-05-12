import { readFileSync, writeFile } from "fs";

const discordMsgPlaybooks = (obj) => {
    let lst = [];
    let total_yds_available = 0;
    for (let i = 0; i < obj.length; i++) {
        // Skip starter playbook
        if (obj[i].title == 'Starter Playbook') {continue;}
        
        // Make a requirements string
        let str = `**${i + 1}) ${obj[i].title}** - Ends <t:${Math.floor(Date.parse(obj[i].endAt)/1000)}:f>`
        for (let j = 0; j < obj[i].tasks.length; j++) {
            // Skip if expired
            if (Date.parse(obj[i].tasks[j].validTo) < Date.now()) {continue;};

            // Add text
            if (obj[i].tasks[j].type == 'UPGRADE') {
                str += `\n    :unlock:: ${obj[i].tasks[j].title}`;
                if (obj[i].tasks[j].category == 'BURN_MOMENT') {str += ' :fire:'}
                str += '\n'
            }
            else  if (obj[i].tasks[j].type == 'POINTS') {
                str += `\n    ${obj[i].tasks[j].title} (${obj[i].tasks[j].rewardPoints} YDS)`;
                total_yds_available += obj[i].tasks[j].rewardPoints;
                if (obj[i].tasks[j].category == 'BURN_MOMENT') {str += ' :fire:'}
            }

            // If it has a different deadline than the playbook itself we want to note that
            if (obj[i].tasks[j].validTo != obj[i].endAt) {
                str += `\n      Deadline: <t:${Math.floor(Date.parse(obj[i].tasks[j].validTo)/1000)}:f>`;
            }
        };

        // Make rewards string
        str += `\n  **Playbook rewards:**`
        for (let j = 0; j < obj[i].levels.length; j++) {
            for (let k = 0; k < obj[i].levels[j].rewards.length; k++) {
                // Excluding useless rewards
                if (!obj[i].levels[j].rewards[k].title.includes('Banner') && !obj[i].levels[j].rewards[k].title.includes('Trophy')) {
                    if (obj[i].levels[j].rewards[k].tier == 'PREMIUM') {
                        str += '\n    :lock:'
                    }
                    else if (obj[i].levels[j].rewards[k].tier == 'GRATIS') {
                        str += '\n    :free:' 
                    }
                    str += ` @${obj[i].levels[j].requiredPoints} YDS, ${obj[i].levels[j].rewards[k].title}`        
                }
            }
        }

        lst.push(str);
    }

    return lst;
    
}

// Fetches playbook info from 'GetActiveRewardPasses', saves to ./src/resources/playbooks.json
const fetchPlaybooks = async (detail) => {
    let tmp;
    let obj;

    // Get filepath
    let filePath = 'src/utils/queryGetActiveRewardPasses'
    switch (detail) {
        case 'full':
            filePath += 'Full.txt';
            break;
        case 'short':
            filePath += 'Short.txt';
            break;
        default:
            filePath += 'Full.txt';
    }

    let query = readFileSync(filePath, { encoding: 'utf-8' });

    const res = await fetch('https://nflallday.com/consumer/graphql?GetActiveRewardPasses', {
        method: "POST",
        body: JSON.stringify({
            operationName:"GetActiveRewardPasses",
            variables: {},
            query: query
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
    tmp = await res.json();

    // Save to file if there's no errors when retrieving data
    if (tmp.hasOwnProperty('errors')) {
        console.log('Error fetching Playbooks!')
    }
    else {
        // Save useful information
        obj = tmp.data.getActiveRewardPasses;
        writeFile('src/resources/playbooks.json', JSON.stringify(obj), (err) => {
            if (err) {
                console.log(err)
            }
        });
    }
    return obj;
}

// Gets playbook JSON from AD Graphql and makes discord msg for each one.
// Only "short" detail for now
export const playbooks = async (detail) => {
    let pb_obj = await fetchPlaybooks('Short');
    let msg_lst = discordMsgPlaybooks(pb_obj);
    return msg_lst;
}

//console.log(await fetchPlaybooks('Short'));

//fetchPlaybooks('Full')