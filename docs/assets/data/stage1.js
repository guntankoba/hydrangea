export const stage1Puzzles = [
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
        accentColor: "#ffc0cb",
        accentShadow: "rgba(255, 192, 203, 0.45)",
    },
];
