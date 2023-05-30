import { queryOTM } from "./queryOtm.js";

// Finds cheapest moment out of a list returned in MP Query
export const findCheapestMoment = async (moments, sortKey = 'change24') => {
    let cheapest = { expLoss: null };
    for (let moment of moments) {
        let params = {
            playerName: moment.node.edition.play.metadata.playerFullName,
            series: moment.node.edition.series.name,
            set: moment.node.edition.set.name
        };
        let [_, expLoss] = await queryOTM(params, sortKey = sortKey);
        moment.expLoss = expLoss;
        if (cheapest.expLoss == null || moment.expLoss < cheapest.expLoss) cheapest = moment;
        if (cheapest.expLoss == 0.95) break;
    }
    return cheapest;
}