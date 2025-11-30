const stationCards = {
    kanamachi: {
        id: "kanamachi",
        name: "金町",
        lineId: "joban-local",
        lineName: "JR常磐緩行線",
        lineColor: "#00A0DE",
        value: 21,
    },
};
export function getStationCardById(id) {
    var _a;
    return (_a = stationCards[id]) !== null && _a !== void 0 ? _a : null;
}
