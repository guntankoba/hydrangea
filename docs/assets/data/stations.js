const stationCards = {
    kanamachi: {
        id: "kanamachi",
        name: "金町",
        lineId: "JL",
        lineName: "JL",
        lineColor: "#00A0DE",
        value: 21,
    },
    akihabara: {
        id: "akihabara",
        name: "秋葉原",
        lineId: "JY",
        lineName: "JY",
        lineColor: "#9ACD32",
        value: 3,
    },
    shinjuku: {
        id: "shinjuku",
        name: "新宿",
        lineId: "JY",
        lineName: "JY",
        lineColor: "#9ACD32",
        value: 17,
    },
    mejiro: {
        id: "mejiro",
        name: "目白",
        lineId: "JY",
        lineName: "JY",
        lineColor: "#9ACD32",
        value: 14,
    },
    "shimokitazawa": {
        id: "shimokitazawa",
        name: "下北沢",
        lineId: "OH",
        lineName: "OH",
        lineColor: "#007ED5",
        value: 7,
    },
    "shimotakaido": {
        id: "shimotakaido",
        name: "下高井戸",
        lineId: "KO",
        lineName: "KO",
        lineColor: "#E7007E",
        value: 7,
    },
    "katase-enoshima": {
        id: "katase-enoshima",
        name: "片瀬江ノ島",
        lineId: "OE",
        lineName: "OE",
        lineColor: "#007ED5",
        value: 16,
    },
    toshimaen: {
        id: "toshimaen",
        name: "豊島園",
        lineId: "E",
        lineName: "E",
        lineColor: "#CE045B",
        value: 36,
    },
    kuramae: {
        id: "kuramae",
        name: "蔵前",
        lineId: "A",
        lineName: "A",
        lineColor: "#EC6E65",
        value: 17,
    },
};
export function getStationCardById(id) {
    var _a;
    return (_a = stationCards[id]) !== null && _a !== void 0 ? _a : null;
}
