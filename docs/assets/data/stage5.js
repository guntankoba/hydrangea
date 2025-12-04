export const stage5Puzzles = [
    {
        id: 501,
        kind: "info",
        title: "ST5",
        lead: "これまで辿ってきた道筋を思い出し、最後の番号を導こう。",
        content: [
            "今日歩いた道で出会った数字を集め、次に進むための番号に仕上げよう。",
            "問題の入力は数字のみ。全角・半角どちらで入力しても判定できる。",
        ],
    },
    {
        id: 502,
        kind: "text",
        title: "次に進むための番号",
        prompt: "今日ふたりが辿ってきた道をすべて足し合わせよ。",
        placeholderClue: "導いた番号を数字で入力（例: 12）",
        correctAnswer: "61",
        acceptedAnswers: ["６１"],
        content: [
            "その合計に、“時を刻まないもの” に欠けている刻印の数字を加えよ。",
            "導かれた数が、次に進むための番号となる。",
        ],
        answerNormalization: "numeric",
    },
];
