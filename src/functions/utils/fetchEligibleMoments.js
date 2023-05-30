import { queryOTM } from "./queryOtm.js";
import { queryCollection } from './queryCollection.js';
import { queryMP } from './queryMP.js';
import { findCheapestMoment } from './findCheapestMoment.js'


// Gathers all MP and Collection moments with prices and slots they fit into
export const fetchEligibleMoments = async (slots, flowAddress, burn = false, sortKey = 'change24') => {
    let mpList = [];
    let ownedObj = {};
    let maxLA = 0;

    // for each of the requirements
    for (let i = 0; i < slots.length; i++) {
        let query = slots[i].query;

        //skip freebies
        if (query == null) {
            continue;
        }

        // Get owned moments
        let collObj = await queryCollection(query, flowAddress);

        for (let j = 0; j < collObj.edges.length; j++) {
            // If moment is not eligible for any previous slot, add it
            if (ownedObj[collObj.edges[j].node.id] == undefined) {
                let playerName = collObj.edges[j].node.edition.play.metadata.playerFullName;
                if (playerName == '') playerName = collObj.edges[j].node.edition.play.metadata.teamName
                let set = collObj.edges[j].node.edition.set.name;
                let series = collObj.edges[j].node.edition.series.name;

                // Get prices
                let params = {
                    playerName: playerName, 
                    series: series,
                    set: set
                };

                let [la, expLoss] = await queryOTM(params, sortKey = sortKey);

                ownedObj[collObj.edges[j].node.id] = {
                    editionFlowID: collObj.edges[j].node.editionFlowID,
                    player: playerName,
                    team: null,       // Popravi null ce je team moment 
                    slots: [i],
                    series: series,
                    set: set,
                    lowAsk: la,
                    expLoss: (burn ? Math.max((la - 1) * 0.95, 0.95) : expLoss)
                }

            }
            // if record already exist, only add slot index
            else {
                ownedObj[collObj.edges[j].node.id].slots.push(i);
            }
        }

        // Get MP moments
        let mpObj = await queryMP(query);
        if (burn) {
            let cheapest = mpObj.edges[0];
            cheapest.expLoss = parseInt(cheapest.node.lowestPrice);
            mpList.push(cheapest);
            maxLA = Math.max(maxLA, parseInt(cheapest.node.lowestPrice) + 1);
        }
        else {
            let cheapest = await findCheapestMoment(mpObj.edges);
            mpList.push(cheapest);
            maxLA = Math.max(maxLA, parseInt(cheapest.lowestPrice) + 1);
        }

    }

    return [mpList, ownedObj, maxLA];
}