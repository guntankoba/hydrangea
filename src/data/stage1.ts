import { ChoiceAccent, Puzzle } from "../types.js";

export const stage1ParkAccents: ChoiceAccent[] = [
  {
    label: "上野恩賜公園",
    highlight: { start: 1, length: 1 },
    accentColor: "#f7a072",
    accentShadow: "rgba(247, 160, 114, 0.45)",
  },
  {
    label: "にいじゅくみらい公園",
    highlight: { start: 0, length: 5 },
    accentColor: "#ffc0cb",
    accentShadow: "rgba(255, 192, 203, 0.45)",
  },
  {
    label: "小石川後楽園",
    highlight: { start: 4, length: 1 },
    accentColor: "#b38bff",
    accentShadow: "rgba(179, 139, 255, 0.45)",
  },
  {
    label: "明治神宮外苑",
    highlight: { start: 4, length: 1 },
    accentColor: "#56cfe1",
    accentShadow: "rgba(86, 207, 225, 0.45)",
  },
  {
    label: "水元公園",
    highlight: { start: 0, length: 1 },
    accentColor: "#52b788",
    accentShadow: "rgba(82, 183, 136, 0.45)",
  },
  {
    label: "玉川上水第三公園",
    highlight: { start: 0, length: 1 },
    accentColor: "#ffd166",
    accentShadow: "rgba(255, 209, 102, 0.45)",
  },
  {
    label: "ひだまり公園あやがわ",
    highlight: { start: 0, length: 1 },
    accentColor: "#ff7aa2",
    accentShadow: "rgba(255, 122, 162, 0.45)",
  },
  {
    label: "等々力渓谷公園",
    highlight: { start: 0, length: 1 },
    accentColor: "#5c7aff",
    accentShadow: "rgba(92, 122, 255, 0.45)",
  },
];

export const stage1Puzzles: Puzzle[] = [
  {
    id: 101,
    kind: "info",
    title: "ST1｜導入",
    lead: "公園の写真から最寄り駅を導き出し、準備ができたら次のステージへ進もう。",
    content: [
      "写真に写っている公園がどこか、候補リストを手がかりに推理してみてください。",
      "答えはひらがなでも漢字でも正解になります。クリアすると自動的にST2が始まります。",
    ],
  },
  {
    id: 102,
    kind: "text",
    title: "この公園のある最寄り駅はどこ？",
    prompt: "写真の公園がある最寄り駅を答えてください。",
    placeholderClue: "ひらがな・漢字どちらでもOK",
    correctAnswer: "かなまち",
    acceptedAnswers: ["金町"],
    imageUrl: "assets/st1-park.svg",
    choices: [
      "上野恩賜公園",
      "にいじゅくみらい公園",
      "小石川後楽園",
      "明治神宮外苑",
      "水元公園",
      "玉川上水第三公園",
      "ひだまり公園あやがわ",
      "等々力渓谷公園",
    ],
    choiceAccents: stage1ParkAccents,
    accentColor: "#ffc0cb",
    accentShadow: "rgba(255, 192, 203, 0.45)",
  },
];
