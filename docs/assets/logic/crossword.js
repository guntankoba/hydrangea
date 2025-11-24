export function ensureCrosswordProgress(puzzle, state // Using any temporarily to avoid circular dependency with AppState, will refine later
) {
    if (!state.crossword[puzzle.id]) {
        state.crossword[puzzle.id] = {
            grid: Array(puzzle.size.rows)
                .fill(null)
                .map(() => Array(puzzle.size.cols).fill("")),
            activeCell: null,
            direction: "across",
        };
    }
    return state.crossword[puzzle.id];
}
export function isCrosswordSolved(puzzle, progress) {
    for (const clue of puzzle.clues) {
        let r = clue.row;
        let c = clue.col;
        const dr = clue.direction === "down" ? 1 : 0;
        const dc = clue.direction === "across" ? 1 : 0;
        for (let i = 0; i < clue.answer.length; i++) {
            if (progress.grid[r][c] !== clue.answer[i]) {
                return false;
            }
            r += dr;
            c += dc;
        }
    }
    return true;
}
export function moveActiveCell(puzzle, progress, dr, dc) {
    if (!progress.activeCell)
        return;
    let { row, col } = progress.activeCell;
    let nextRow = row + dr;
    let nextCol = col + dc;
    // Check bounds
    if (nextRow >= 0 &&
        nextRow < puzzle.size.rows &&
        nextCol >= 0 &&
        nextCol < puzzle.size.cols) {
        // Check if the cell is valid (part of any clue)
        const isValid = puzzle.clues.some((clue) => {
            const isAcross = clue.direction === "across";
            const isDown = clue.direction === "down";
            if (isAcross) {
                return (nextRow === clue.row &&
                    nextCol >= clue.col &&
                    nextCol < clue.col + clue.answer.length);
            }
            if (isDown) {
                return (nextCol === clue.col &&
                    nextRow >= clue.row &&
                    nextRow < clue.row + clue.answer.length);
            }
            return false;
        });
        if (isValid) {
            progress.activeCell = { row: nextRow, col: nextCol };
        }
    }
}
export function getClueAt(puzzle, row, col, direction) {
    return puzzle.clues.find((clue) => {
        if (clue.direction !== direction)
            return false;
        if (direction === "across") {
            return (clue.row === row && col >= clue.col && col < clue.col + clue.answer.length);
        }
        else {
            return (clue.col === col && row >= clue.row && row < clue.row + clue.answer.length);
        }
    });
}
export function isBlock(puzzle, row, col) {
    return !puzzle.clues.some((clue) => {
        const isAcross = clue.direction === "across";
        if (isAcross) {
            return (clue.row === row &&
                col >= clue.col &&
                col < clue.col + clue.answer.length);
        }
        else {
            return (clue.col === col &&
                row >= clue.row &&
                row < clue.row + clue.answer.length);
        }
    });
}
export function updateCell(puzzle, progress, value) {
    if (!progress.activeCell)
        return;
    const { row, col } = progress.activeCell;
    if (!isBlock(puzzle, row, col)) {
        progress.grid[row][col] = value;
    }
}
