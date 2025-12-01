export const stage5Puzzles = [
    {
        id: 501,
        kind: "info",
        title: "ST5｜最終アクセス",
        lead: "目白から椿山荘へ向かう最後の導線を解き、ゴールを目指そう。",
        content: [
            "目白に到着したら、椿山荘へ向かう手段を導き出そう。",
            "問題の入力は数字のみ。全角・半角どちらで入力しても判定できる。",
        ],
    },
    {
        id: 502,
        kind: "text",
        title: "目白から椿山荘へ",
        prompt: "椿山荘へ向かう都バスの系統番号を入力してください（数字のみ）。",
        placeholderClue: "2 桁の数字で入力（例: 12）",
        correctAnswer: "61",
        acceptedAnswers: ["６１"],
        content: [
            "バス停の行き先表示や系統番号を手がかりにして、椿山荘に向かう路線を特定しよう。",
        ],
        answerNormalization: "numeric",
    },
];
