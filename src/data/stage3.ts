import { Puzzle } from "../types.js";

const accentColor = "#4da3ff";
const accentShadow = "rgba(77, 163, 255, 0.35)";

export const stage3Puzzles: Puzzle[] = [
  {
    id: 301,
    kind: "info",
    title: "ST3｜変換規則パズル",
    lead: "今から指定された範囲の街を歩き、問いに答えよう。",
    content: [
      "対象範囲は下記の地図の範囲です。",
      "https://www.google.com/maps/d/u/0/edit?mid=1BEpJfy5qhI5YJjXIJMTrt3YmsTS90YA&usp=sharing",
      "すべて外で見つけることができるもになってるはずです。",
    ],
  },
  {
    id: 302,
    kind: "text",
    title: "Q1｜白猫と向き合う赤牛",
    prompt: "白猫と向き合う赤牛　〇〇①〇〇〇④〇〇",
    placeholderClue: "ひらがなで店名を入力",
    correctAnswer: "やきにくのまんせい",
    content: [],
    imageUrl: "assets/images/stage3_q1_sign.svg",
    imageAlt: "白猫と赤牛が向かい合う看板のサンプル",
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
    imageUrl: "assets/images/stage3_q2_sign.svg",
    imageAlt: "緑色の狸を描いた看板のサンプル",
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
    imageUrl: "assets/images/stage3_q3_sign.svg",
    imageAlt: "青い看板に猫と鶏が並ぶサンプル",
    accentColor,
    accentShadow,
  },
  {
    id: 305,
    kind: "text",
    title: "FINAL｜変換規則を完成させよ",
    prompt: "① → ②、③ → ④ の規則を 青いアクセントで示されたひらがなに適用し、新たな駅名を入力せよ。",
    placeholderClue: "変換後の駅名を入力",
    correctAnswer: "しんじゅく",
    acceptedAnswers: ["新宿"],
    content: [
      "Q1〜Q3 で判明した ① → ②、③ → ④ の変換規則を使ってください。",
      "空欄をすべて埋めた上で、以前のステージで青色に示されたひらがなへ規則を当てはめた駅名を入力しましょう。",
    ],
    accentColor,
    accentShadow,
    transformPairs: [
      { from: "①", to: "②" },
      { from: "③", to: "④" },
    ],
  },
];
