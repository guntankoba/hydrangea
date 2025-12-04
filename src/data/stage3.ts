import { Puzzle } from "../types.js";

const accentColor = "#4da3ff";
const accentShadow = "rgba(77, 163, 255, 0.35)";

export const stage3Puzzles: Puzzle[] = [
  {
    id: 301,
    kind: "info",
    title: "ステージ3",
    lead: "今から指定された範囲の街を歩き、問いに答えよう。",
    content: [
      "対象範囲は下記の地図の範囲です。",
      "https://www.google.com/maps/d/u/0/edit?mid=1BEpJfy5qhI5YJjXIJMTrt3YmsTS90YA&usp=sharing",
      "すべて外で見つけることができるものになっているはずです。",
    ],
    imageUrl: "images/st3_akihabara_map.png",
    imageAlt: "秋葉原エリアの指定範囲マップ",
  },
  {
    id: 302,
    kind: "text",
    title: "Q1｜白猫と向き合う赤牛",
    prompt: "白猫と向き合う赤牛　〇〇①〇〇〇④〇〇",
    placeholderClue: "ひらがなで店名を入力",
    correctAnswer: "やきにくのまんせい",
    content: [],
    accentColor,
    accentShadow,
  },
  {
    id: 303,
    kind: "text",
    title: "Q2｜緑の狸",
    prompt: "緑の狸　〇〇〇②〇〇〇〇④〇〇",
    placeholderClue: "ひらがなで店名を入力",
    correctAnswer: "かーどしょっぷぽんぽこ",
    content: [],
    accentColor,
    accentShadow,
  },
  {
    id: 304,
    kind: "text",
    title: "Q3｜猫と鶏が隣り合う青い方",
    prompt: "猫と鶏が隣り合う青い方　〇③〇〇〇〇④",
    placeholderClue: "ひらがなで店名を入力",
    correctAnswer: "はいからちきん",
    content: [],
    accentColor,
    accentShadow,
  },
  {
    id: 305,
    kind: "text",
    title: "FINAL｜変換規則を完成させよ",
    prompt: "",
    placeholderClue: "次の目的地を入力",
    correctAnswer: "しんじゅく",
    acceptedAnswers: ["新宿"],
    answerInputClass: "final-answer-input",
    imageUrl: "images/st3.jpg",
    imageAlt: "変換規則を示すボード",
    accentColor,
    accentShadow,
  },
];
