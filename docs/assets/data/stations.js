const stationCards = {
    kanamachi: {
        id: "kanamachi",
        name: "金町",
        lineId: "joban-local",
        lineName: "JR常磐緩行線",
        lineColor: "#00A0DE",
        value: 21,
    },
    akihabara: {
        id: "akihabara",
        name: "秋葉原",
        lineId: "yamanote",
        lineName: "JR山手線",
        lineColor: "#9ACD32",
        value: 3,
    },
    shinjuku: {
        id: "shinjuku",
        name: "新宿",
        lineId: "yamanote",
        lineName: "JR山手線",
        lineColor: "#9ACD32",
        value: 17,
    },
    mejiro: {
        id: "mejiro",
        name: "目白",
        lineId: "yamanote",
        lineName: "JR山手線",
        lineColor: "#9ACD32",
        value: 14,
    },
    "shimokitazawa": {
        id: "shimokitazawa",
        name: "下北沢",
        lineId: "odakyu-main",
        lineName: "小田急小田原線",
        lineColor: "#007ED5",
        value: 7,
    },
    "shimotakaido": {
        id: "shimotakaido",
        name: "下高井戸",
        lineId: "keio",
        lineName: "京王線",
        lineColor: "#E7007E",
        value: 7,
    },
    "katase-enoshima": {
        id: "katase-enoshima",
        name: "片瀬江ノ島",
        lineId: "odakyu-enoshima",
        lineName: "小田急江ノ島線",
        lineColor: "#007ED5",
        value: 16,
    },
    toshimaen: {
        id: "toshimaen",
        name: "豊島園",
        lineId: "toei-oedo",
        lineName: "都営大江戸線",
        lineColor: "#CE045B",
        value: 36,
    },
    kuramae: {
        id: "kuramae",
        name: "蔵前",
        lineId: "toei-asakusa",
        lineName: "都営浅草線",
        lineColor: "#EC6E65",
        value: 17,
    },
};
export function getStationCardById(id) {
    var _a;
    return (_a = stationCards[id]) !== null && _a !== void 0 ? _a : null;
}
