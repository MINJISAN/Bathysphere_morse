const cellSize = 75
const canvasWidth = 862.5
const canvasHeight = 450

let gameObjects = []
let game
let renderer
let submitBoard

var setPieces = {}

window.onload = init

function init() {
  const historyDiv = $('#historyDiv') // For auto scroll
  const historyTable = document.querySelector('#historyTable')
  const queryInput = document.querySelector('#queryInput')
  const queryButton = document.querySelector('#queryButton')
  const getmapButtom = document.querySelector('#getmapButton')
  const submitButton = document.querySelector('#submitButton')
  const resultText = document.querySelector('#resultText')
  const morseCodeText = document.querySelector('#morseCodeText')
  const morseLetterText = document.querySelector('#morseLetterText')
  const morseOutputText = document.querySelector('#morseOutputText')
  const morseTree = document.querySelector('#morseTree')
  const morseTableBody = document.querySelector('#morseTableBody')
  const letterGrid = document.querySelector('#letterGrid')
  const autoArrangeButton = document.querySelector('#autoArrangeButton')
  const targetStatusText = document.querySelector('#targetStatusText')
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const selectedLetters = new Set()
  const morseTreeNodes = {}
  const morseTreeLinks = {}
  const pieces = []

  const canvas = document.querySelector('#canvas')
  renderer = new Renderer(canvas)

  game = new MirrorGame()
  console.log('Answer:', game.answer)

  submitBoard = new Board(0, 0, game.boardCol, game.boardRow)
  submitBoard.onNumberClick = function(n) {
    queryInput.value = n
    updateMorsePreview()
  }
  gameObjects.push(submitBoard)

  const laserView = new LaserView(submitBoard)
  laserView.z = 2
  gameObjects.push(laserView)

  // Init pieces
  for (let i = 0; i < game.initPieces.length; i++) {
    const x = canvasHeight + cellSize/2 + cellSize*2.5*Math.floor(i/2)
    const y = cellSize/2 + cellSize/4 + cellSize*2.5*Math.floor(i%2)
    const cellState = game.initPieces[i]
    const color = cellState[0].length > 1 ? '#73AB84' : '#99D19C'
    const piece = new Piece(x, y, cellState, color, submitBoard)
    pieces.push(piece)
    gameObjects.push(piece)
  }

  // Handle user control
  canvas.addEventListener('mousedown', function(event) {
    gameObjects.forEach(obj => obj.onMouseEvent(event))
  })
  canvas.addEventListener('mousemove', function(event) {
    gameObjects.forEach(obj => obj.onMouseEvent(event))
  })
  canvas.addEventListener('mouseup', function(event) {
    gameObjects.forEach(obj => obj.onMouseEvent(event))
    updateMorsePreview()
    updateMorseTable()
  })
  window.addEventListener('keydown', function(event) {
    gameObjects.forEach(obj => obj.onKeyboardEvent(event))
  })

  // handleQueryForm
  queryButton.addEventListener('click', function(event) {
    const start = parseInt(queryInput.value)
    if (start) {
      updateMorsePreview()
      const boardTrace = traceRay(submitBoard.grid.cellState, start)
      const {tryCount, reflect, goal} = game.query(start)
      const row = historyTable.insertRow(tryCount-1)
      row.insertCell(0).innerHTML = tryCount
      row.insertCell(1).innerHTML = start
      row.insertCell(2).innerHTML = reflect
      row.insertCell(3).innerHTML = goal
      row.insertCell(4).innerHTML = boardTrace.morse || '-'
      row.insertCell(5).innerHTML = boardTrace.letter
      historyDiv.scrollTop(historyDiv[0].scrollHeight)
      submitButton.disabled = false
    }
  })

  queryInput.addEventListener('input', updateMorsePreview)
  autoArrangeButton.addEventListener('click', arrangeSelectedLetters)

  // handleGetPieceMap
  getmapButtom.addEventListener('click', function(event) {
    let cellState = submitBoard.grid.cellState
    // 2D Array to string
    let cellStateStr = cellState.map(row => row.join('')).join('\n')
    // Replace ' ' to 'E'
    cellStateStr = cellStateStr.replace(/ /g, 'E')
    console.log(cellStateStr)
    console.log(JSON.stringify(Object.values(setPieces)))
  })

  submitButton.disabled = true
  submitButton.addEventListener('click', function(event) {
    const win = game.checkWin(submitBoard.grid.cellState)
    if (win) {
      resultText.style.color = 'green'
      resultText.innerHTML = 'Correct!'
    } else {
      resultText.style.color = 'red'
      resultText.innerHTML = 'Incorrect...'
    }
    submitButton.disabled = true
  })

  initMorseTree()
  updateMorsePreview()
  updateMorseTable()
  window.requestAnimationFrame(gameLoop)

  function updateMorsePreview() {
    const start = parseInt(queryInput.value)
    const trace = traceRay(submitBoard.grid.cellState, start)
    if (!trace) {
      morseCodeText.innerHTML = '-'
      morseLetterText.innerHTML = '-'
      morseOutputText.innerHTML = '-'
      updateMorseTree('')
      return
    }

    morseCodeText.innerHTML = trace.morse || '-'
    morseLetterText.innerHTML = trace.letter
    morseOutputText.innerHTML = trace.goal
    updateMorseTree(trace.morse)
  }

  function updateMorseTable() {
    morseTableBody.innerHTML = ''
    const letters = new Set()
    const maxInput = submitBoard.row * 2 + submitBoard.col * 2
    for (let n = 1; n <= maxInput; n++) {
      const trace = traceRay(submitBoard.grid.cellState, n)
      if (alphabet.includes(trace.letter)) {
        letters.add(trace.letter)
      }
      const row = morseTableBody.insertRow()
      row.insertCell(0).innerHTML = n
      row.insertCell(1).innerHTML = trace.reflect
      row.insertCell(2).innerHTML = trace.goal
      row.insertCell(3).innerHTML = trace.morse || '-'
      row.insertCell(4).innerHTML = trace.letter
    }
    updateLetterGrid(letters)
  }

  function updateLetterGrid(letters) {
    letterGrid.innerHTML = ''
    alphabet.forEach(letter => {
      const item = document.createElement('div')
      const classes = ['letter-badge']
      if (letters.has(letter)) {
        classes.push('active')
      }
      if (selectedLetters.has(letter)) {
        classes.push('selected')
      }
      item.className = classes.join(' ')
      item.innerHTML = letter
      item.addEventListener('click', function() {
        if (selectedLetters.has(letter)) {
          selectedLetters.delete(letter)
        } else {
          selectedLetters.add(letter)
        }
        targetStatusText.innerHTML = ''
        updateLetterGrid(letters)
      })
      letterGrid.appendChild(item)
    })
  }

  function arrangeSelectedLetters() {
    const targets = new Set(selectedLetters)
    if (targets.size === 0) {
      targetStatusText.style.color = '#374151'
      targetStatusText.innerHTML = 'Select letters first.'
      return
    }

    autoArrangeButton.disabled = true
    targetStatusText.style.color = '#374151'
    targetStatusText.innerHTML = 'Searching...'

    setTimeout(function() {
      const solution = findArrangementForLetters(targets)
      if (!solution) {
        targetStatusText.style.color = '#dc2626'
        targetStatusText.innerHTML = 'No possible arrangement.'
        autoArrangeButton.disabled = false
        return
      }

      applyArrangement(solution)
      updateMorsePreview()
      updateMorseTable()
      targetStatusText.style.color = '#16a34a'
      targetStatusText.innerHTML = 'Arrangement found.'
      autoArrangeButton.disabled = false
    }, 10)
  }

  function findArrangementForLetters(targets) {
    const candidates = game.initPieces.map(piece => genPieceCandidates(piece, game.boardRow, game.boardCol))
    const board = genEmptyGrid(game.boardRow, game.boardCol)
    const placements = []

    function search(pieceIndex) {
      if (pieceIndex === candidates.length) {
        return boardIncludesLetters(board, targets) ? placements.map(copyPlacement) : null
      }

      for (let i = 0; i < candidates[pieceIndex].length; i++) {
        const candidate = candidates[pieceIndex][i]
        if (!isEmpty(board, candidate.row, candidate.col, candidate.state.length, candidate.state[0].length)) {
          continue
        }
        fillGrid(board, candidate.row, candidate.col, candidate.state)
        placements[pieceIndex] = candidate
        const result = search(pieceIndex + 1)
        if (result) {
          return result
        }
        fillGrid(board, candidate.row, candidate.col, genEmptyGrid(candidate.state.length, candidate.state[0].length))
        placements[pieceIndex] = null
      }
      return null
    }

    return search(0)
  }

  function genPieceCandidates(piece, boardRow, boardCol) {
    const candidates = []
    const seenStates = new Set()
    let state = cloneGrid(piece)
    for (let rotation = 0; rotation < 4; rotation++) {
      const key = state.map(row => row.join('')).join('|')
      if (!seenStates.has(key)) {
        seenStates.add(key)
        for (let row = 0; row <= boardRow - state.length; row++) {
          for (let col = 0; col <= boardCol - state[0].length; col++) {
            candidates.push({
              row,
              col,
              rotation,
              state: cloneGrid(state)
            })
          }
        }
      }
      state = rotate90(state)
    }
    return candidates
  }

  function boardIncludesLetters(board, targets) {
    const letters = new Set()
    const maxInput = board.length * 2 + board[0].length * 2
    for (let n = 1; n <= maxInput; n++) {
      const trace = traceRay(board, n)
      if (alphabet.includes(trace.letter)) {
        letters.add(trace.letter)
      }
    }

    for (const target of targets) {
      if (!letters.has(target)) {
        return false
      }
    }
    return true
  }

  function applyArrangement(placements) {
    submitBoard.grid.cellState = genEmptyGrid(game.boardRow, game.boardCol)
    setPieces = {}
    for (let i = 0; i < placements.length; i++) {
      const placement = placements[i]
      const piece = pieces[i]
      piece.cellState = cloneGrid(placement.state)
      piece.x = submitBoard.grid.x + placement.col * cellSize
      piece.y = submitBoard.grid.y + placement.row * cellSize
      piece.boardRow = placement.row
      piece.boardCol = placement.col
      piece.rotation = placement.rotation
      piece.name = `piece_${placement.row}_${placement.col}_${i}`
      fillGrid(submitBoard.grid.cellState, placement.row, placement.col, piece.cellState)
      setPieces[piece.name] = {
        "type": (piece.cellState.length > 1 && piece.cellState[0].length > 1) ? 'full' : 'half',
        "x": piece.boardCol,
        "y": piece.boardRow,
        "rotation": (piece.cellState.length > 1 && piece.cellState[0].length > 1) ? 0 : (piece.rotation - 1 + 4) % 4
      }
    }
  }

  function cloneGrid(grid) {
    return grid.map(row => row.slice())
  }

  function copyPlacement(placement) {
    return {
      row: placement.row,
      col: placement.col,
      rotation: placement.rotation,
      state: cloneGrid(placement.state)
    }
  }

  function initMorseTree() {
    const svgNS = 'http://www.w3.org/2000/svg'
    const letterByCode = {}
    Object.keys(MORSE_TABLE).forEach(code => {
      letterByCode[code] = MORSE_TABLE[code]
    })

    const positions = { '': { x: 130, y: 18 } }
    Object.keys(letterByCode).forEach(code => {
      let x = 130
      let y = 18
      for (let i = 0; i < code.length; i++) {
        const step = 72 / Math.pow(2, i)
        x += code[i] === '.' ? -step : step
        y += 38
        const partial = code.slice(0, i + 1)
        positions[partial] = { x, y }
      }
    })

    Object.keys(positions)
      .filter(code => code)
      .sort((a, b) => a.length - b.length)
      .forEach(code => {
        const parentCode = code.slice(0, -1)
        const parent = positions[parentCode]
        const point = positions[code]
        const line = document.createElementNS(svgNS, 'line')
        line.setAttribute('x1', parent.x)
        line.setAttribute('y1', parent.y)
        line.setAttribute('x2', point.x)
        line.setAttribute('y2', point.y)
        line.setAttribute('class', 'tree-link')
        morseTreeLinks[code] = line
        morseTree.appendChild(line)
      })

    Object.keys(positions)
      .sort((a, b) => a.length - b.length)
      .forEach(code => {
        const point = positions[code]
        const group = document.createElementNS(svgNS, 'g')
        const circle = document.createElementNS(svgNS, 'circle')
        const text = document.createElementNS(svgNS, 'text')
        circle.setAttribute('cx', point.x)
        circle.setAttribute('cy', point.y)
        circle.setAttribute('r', code ? 9 : 6)
        circle.setAttribute('class', 'tree-node')
        text.setAttribute('x', point.x)
        text.setAttribute('y', point.y)
        text.setAttribute('class', 'tree-label')
        text.textContent = code ? letterByCode[code] : ''
        group.appendChild(circle)
        group.appendChild(text)
        morseTreeNodes[code] = circle
        morseTree.appendChild(group)
      })
  }

  function updateMorseTree(morse) {
    Object.values(morseTreeNodes).forEach(node => {
      node.setAttribute('class', 'tree-node')
    })
    Object.values(morseTreeLinks).forEach(link => {
      link.setAttribute('class', 'tree-link')
    })

    let code = ''
    morseTreeNodes[code].setAttribute('class', 'tree-node active')
    for (let i = 0; i < morse.length; i++) {
      code += morse[i]
      if (!morseTreeNodes[code]) {
        return
      }
      morseTreeLinks[code].setAttribute('class', 'tree-link active')
      morseTreeNodes[code].setAttribute('class', 'tree-node active')
    }

    if (morse && morseTreeNodes[morse] && MORSE_TABLE[morse]) {
      morseTreeNodes[morse].setAttribute('class', 'tree-node target')
    }
  }
}

function gameLoop(timeStamp) {
  draw()
  window.requestAnimationFrame(gameLoop)
}

function draw() {
  renderer.drawBackground()
  gameObjects.sort((a, b) => (a.z - b.z))
  gameObjects.forEach(obj => obj.draw())
}
