class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  drawBackground() {
    this.ctx.fillStyle = '#79C7C5'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.strokeStyle = 'black'
    this.ctx.lineWidth = 0.5
    this.ctx.beginPath()
    this.ctx.moveTo(this.canvas.height, 0)
    this.ctx.lineTo(this.canvas.height, this.canvas.height)
    this.ctx.stroke()
  }

  drawCell(x, y, cellSize, state, color) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, cellSize, cellSize)
    this.ctx.strokeStyle = 'black'
    this.ctx.lineWidth = 0.5
    this.ctx.strokeRect(x, y, cellSize, cellSize)
    if (state == 'S') {
      this.ctx.beginPath()
      this.ctx.moveTo(x + cellSize, y)
      this.ctx.lineTo(x, y + cellSize)
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }
    if (state == 'B') {
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
      this.ctx.lineTo(x + cellSize, y + cellSize)
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }
  }

  drawText(x, y, fontSize, text) {
    this.ctx.font = fontSize + 'px serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillStyle = 'black'
    this.ctx.fillText(text, x, y)
  }

  drawLaser(path) {
    if (path.length < 2) {
      return
    }
    this.ctx.beginPath()
    this.ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i].x, path[i].y)
    }
    this.ctx.strokeStyle = 'red'
    this.ctx.lineWidth = 3
    this.ctx.stroke()
    this.ctx.strokeStyle = 'white'
    this.ctx.lineWidth = 1
    this.ctx.stroke()
  }
}