// cellSize: global variable

class gameObject {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.z = 0
  }

  draw() { }
  onMouseEvent() { }
  onKeyboardEvent() { }
}

class Grid extends gameObject {
  constructor(x, y, cellState, cellColor) {
    super(x, y)
    this.cellState = cellState
    this.cellColor = cellColor
  }

  get row() {
    return this.cellState.length
  }

  get col() {
    return this.cellState[0].length
  }

  get height() {
    return this.row * cellSize
  }

  get width() {
    return this.col * cellSize
  }

  draw() {
    for (let r = 0; r < this.row; r++) {
      for (let c = 0; c < this.col; c++) {
        const x = this.x + c * cellSize
        const y = this.y + r * cellSize
        renderer.drawCell(x, y, cellSize, this.cellState[r][c], this.cellColor)
      }
    }
  }
}

class Board extends gameObject {
  constructor(x, y, col, row) {
    super(x, y)
    this.col = col
    this.row = row
    const cellState = genEmptyGrid(row, col)
    this.grid = new Grid(x + cellSize / 2, y + cellSize / 2, cellState, '#ADE1E5')

    this.onNumberHover = () => { }
    this.onNumberClick = () => { }
  }

  get height() {
    return (this.grid.row + 1) * cellSize
  }

  get width() {
    return (this.grid.col + 1) * cellSize
  }

  draw() {
    this.grid.draw()

    for (let n = 1; n <= this.grid.row * 2 + this.grid.col * 2; n++) {
      const { x, y, dx, dy } = n2ray(n, this.grid.row, this.grid.col)
      let tx = this.grid.x + x * cellSize + cellSize / 2 + dx * cellSize / 4
      let ty = this.grid.y + y * cellSize + cellSize / 2 + dy * cellSize / 4
      const fontSize = this.focusNumber === n ? cellSize / 3 : cellSize / 4
      renderer.drawText(tx, ty, fontSize, '' + n)
    }
  }

  findClosestCell(x, y) {
    let m = Infinity
    let row, col
    for (let r = 0; r < this.row; r++) {
      for (let c = 0; c < this.col; c++) {
        const gx = this.grid.x + c * cellSize
        const gy = this.grid.y + r * cellSize
        const d = (x - gx) * (x - gx) + (y - gy) * (y - gy)
        if (d < m) {
          m = d
          row = r
          col = c
        }
      }
    }
    return { row, col }
  }

  findCell(x, y) {
    const row = Math.floor((x - this.grid.x) / cellSize)
    const col = Math.floor((y - this.grid.y) / cellSize)
    return { row, col }
  }

  onMouseEvent(event) {
    if (event.type === 'mousedown') {
      if (this.focusNumber) {
        this.onNumberClick(this.focusNumber)
      }
    } else if (event.type === 'mousemove') {
      const mx = event.offsetX
      const my = event.offsetY
      let n = null
      if (rectInclude(this.x, this.x + this.width, this.y, this.y + this.height, mx, my)) {
        const { row, col } = this.findCell(mx, my)
        n = ray2n(row, col, this.row, this.col)
      } else {
        n = null
      }
      if (this.focusNumber !== n) {
        this.onNumberHover(n)
      }
      this.focusNumber = n
    }
  }
}

class Piece extends Grid {
  constructor(x, y, cellState, cellColor, board) {
    super(x, y, cellState, cellColor)
    this.draging = false
    this.dx = 0
    this.dy = 0
    this.initX = this.x
    this.initY = this.y
    this.board = board
    this.boardRow = null
    this.boardCol = null
    this.rotation = 0
    this.name = ''
  }

  onMouseEvent(event) {
    if (event.type === 'mousedown') {
      const mx = event.offsetX
      const my = event.offsetY
      if (rectInclude(this.x, this.x + this.width, this.y, this.y + this.height, mx, my)) {
        this.dx = mx - this.x
        this.dy = my - this.y
        this.draging = true
        this.z = 1
        if (this.boardRow !== null) {
          this.clearBoard()
          this.boardRow = null
          this.boardCol = null
        }
      }
    } else if (event.type === 'mousemove') {
      if (this.draging) {
        this.x = event.offsetX - this.dx
        this.y = event.offsetY - this.dy
      }
    } else if (event.type === 'mouseup') {
      if (this.draging) {
        this.draging = false
        this.z = 0
        if (rectInclude(this.board.x, this.board.x + this.board.width - this.width,
          this.board.y, this.board.y + this.board.height - this.height,
          this.x, this.y)
        ) {
          const { row, col } = this.board.findClosestCell(this.x, this.y)
          if (isEmpty(this.board.grid.cellState, row, col, this.row, this.col)) {
            this.x = this.board.grid.x + col * cellSize
            this.y = this.board.grid.y + row * cellSize
            this.boardRow = row
            this.boardCol = col
            fillGrid(this.board.grid.cellState, row, col, this.cellState)

            this.name = `piece_${row}_${col}`
            const pieceType = getPieceType(this.cellState)
            setPieces[this.name] = {
              "type": pieceType,
              "x": this.boardCol,
              "y": this.boardRow,
              "rotation": pieceType === 'half' ? (this.rotation - 1 + 4) % 4 : 0
            }
          } else {
            this.x = this.initX
            this.y = this.initY
          }
        } else {
          this.x = this.initX
          this.y = this.initY
        }
      }
    }
  }

  onKeyboardEvent(event) {
    if (event.type === 'keydown' && event.key === 'r') {
      if (this.draging) {
        this.cellState = rotate90(this.cellState)
        this.rotation = (this.rotation - 1 + 4) % 4
      }
    }
  }

  clearBoard() {
    const state = genEmptyGrid(this.row, this.col)
    fillGrid(this.board.grid.cellState, this.boardRow, this.boardCol, state)
    delete setPieces[this.name]
  }
}

class LaserView extends gameObject {
  constructor(board) {
    super(0, 0)
    this.path = []
    this.board = board
    this.board.onNumberHover = (n) => {
      if (n) {
        this.path = this.genPathFrom(n)
      } else {
        this.path = []
      }
    }
  }

  draw() {
    renderer.drawLaser(this.path)
  }

  genPathFrom(n) {
    const trace = traceRay(this.board.grid.cellState, n)
    if (!trace) {
      return []
    }
    return trace.path.map((point, i) => {
      const isStart = i === 0
      const isGoal = i === trace.path.length - 1
      const offsetX = isStart ? point.dx / 2 : (isGoal ? -point.dx / 2 : 0)
      const offsetY = isStart ? point.dy / 2 : (isGoal ? -point.dy / 2 : 0)
      return {
        x: this.board.grid.x + (point.x + offsetX) * cellSize + cellSize/2,
        y: this.board.grid.y + (point.y + offsetY) * cellSize + cellSize/2
      }
    })
  }
}
