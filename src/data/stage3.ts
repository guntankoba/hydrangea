import { Puzzle } from "../types.js";

const accentColor = "#4da3ff";
const accentShadow = "rgba(77, 163, 255, 0.35)";

export const stage3Puzzles: Puzzle[] = [
  {
    id: 301,
    kind: "info",
    title: "ST3｜変換規則パズル",
    lead: "秋葉原の看板を巡って ①〜④ を集め、ST1 の \"にいじゅく\" を変換しよう。",
    content: [
      "ステージ開始時点で ① → ②、③ → ④ の空欄を提示し、順番に埋めていきます。",
      "最終的に ① = に、② = し、③ = い、④ = ん を導き、\"にいじゅく\" を \"しんじゅく\" に変換するのがゴールです。",
      "回答はすべてひらがな・漢字どちらでも判定できますが、問題文の指示に合わせて入力してください。",
    ],
  },
  {
    id: 302,
    kind: "text",
    title: "Q1｜白猫と向き合う赤牛",
    prompt: "白猫と向き合う赤牛　〇〇①〇〇〇〇〇〇",
    placeholderClue: "ひらがなで店名を入力",
    correctAnswer: "やきにくのまんせい",
    content: ["3文字目が ① になります。"],
    accentColor,
    accentShadow,
  },
  {
    id: 303,
    kind: "text",
    title: "Q2｜緑のたぬき",
    prompt: "緑のたぬき　〇〇〇②〇〇〇〇〇〇〇",
    placeholderClue: "ひらがなで店名を入力",
    correctAnswer: "かーどしょっぷぽんぽこ",
    content: ["4文字目が ② になります。"],
    accentColor,
    accentShadow,
  },
  {
    id: 304,
    kind: "text",
    title: "Q3｜猫と鶏が隣り合う青い方",
    prompt: "猫と鶏が隣り合う青い方　〇③〇〇〇〇〇",
    placeholderClue: "ひらがなで店名を入力",
    correctAnswer: "はいからちきん",
    content: ["2文字目が ③ になります。"],
    accentColor,
    accentShadow,
  },
  {
    id: 305,
    kind: "text",
    title: "Q4｜①〜③ から導く ④",
    prompt: "Q1 の 7 文字目、Q2 の 9 文字目、Q3 の 7 文字目",
    placeholderClue: "指定の文字をまとめて入力",
    correctAnswer: "ん",
    acceptedAnswers: ["ン"],
    content: ["いずれも同じ文字になるので、その文字を ④ に入れてください。"],
    accentColor,
    accentShadow,
  },
  {
    id: 306,
    kind: "text",
    title: "FINAL｜変換規則を完成させよ",
    prompt: "① → ②、③ → ④ の規則を ST1 の『にいじゅく』（🔵背景）に適用し、新たな駅名を入力せよ。",
    placeholderClue: "しんじゅく / 新宿",
    correctAnswer: "しんじゅく",
    acceptedAnswers: ["新宿"],
    content: [
      "これまでに判明した規則： に → し、 い → ん。",
      "『にいじゅく』を変換すると『しんじゅく』になります。",
    ],
    accentColor,
    accentShadow,
  },
];
