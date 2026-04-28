class MirrorGame {
  constructor() {
    this.boardRow = 5
    this.boardCol = 5

    this.initPieces = [
      [['S', 'B'],
       ['B', 'S']],
      [['S', 'B'],
       ['B', 'S']],
      [['S'],
       ['B']],
      [['S'],
       ['B']],
      [['O']]
    ]

    this.newGame()
  }

  newGame() {
    this.tryCount = 0

    this.answer = genEmptyGrid(this.boardRow, this.boardCol)

    for (let i = 0; i < this.initPieces.length; i++) {
      while (true) {
        let piece = this.initPieces[i]
        const rotateCount = Math.floor(Math.random() * 4)
        for (let j = 0; j < rotateCount; j++) {
          piece = rotate90(piece)
        }

        const pieceRow = piece.length
        const pieceCol = piece[0].length

        const r = Math.floor(Math.random() * (this.boardRow - pieceRow + 1))
        const c = Math.floor(Math.random() * (this.boardCol - pieceCol + 1))
        if (isEmpty(this.answer, r, c, pieceRow, pieceCol)) {
          fillGrid(this.answer, r, c, piece)
          break
        }
      }
    }
  }

  query(n) {
    this.tryCount++

    const {reflect, goal, morse, letter} = traceRay(this.answer, n)
    return {tryCount:this.tryCount, reflect, goal, morse, letter}
  }

  checkWin(board) {
    for (let r = 0; r < this.boardRow; r++) {
      for (let c = 0; c < this.boardCol; c++) {
        if (this.answer[r][c] !== board[r][c]) {
          return false
        }
      }
    }
    return true
  }
}
