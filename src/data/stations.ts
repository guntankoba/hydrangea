import { StationCard } from "../types.js";

const stationCards: Record<string, StationCard> = {
  kanamachi: {
    id: "kanamachi",
    name: "金町",
    lineId: "joban-local",
    lineName: "JR常磐緩行線",
    lineColor: "#00A0DE",
    value: 21,
  },
};

export function getStationCardById(id: string): StationCard | null {
  return stationCards[id] ?? null;
}
