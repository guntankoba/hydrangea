export const stage5Puzzles = [
    {
        id: 501,
        kind: "info",
        title: "ST5｜最終アクセス",
        lead: "最後のステージ。到着確認のための番号を入力しよう。",
        content: ["入力は数字のみ。全角・半角どちらも判定可能。"],
    },
    {
        id: 502,
        kind: "text",
        title: "次に進むための番号",
        prompt: "今日ふたりが辿ってきた道の数字をすべて足し合わせよ。",
        placeholderClue: "導いた番号を数字で入力",
        correctAnswer: "61",
        acceptedAnswers: ["６１"],
        content: [],
        answerNormalization: "numeric",
    },
];
