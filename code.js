var pad = document.querySelector('canvas')
var c = pad.getContext('2d')
pad.width = innerWidth
pad.height = innerHeight
var scoreEl = document.querySelector('#scoreEl')
var startGameBtn = document.querySelector('#startGameBtn')
var modalEl = document.querySelector('#modalEl')
var bigScoreEl = document.querySelector('#bigScoreEl')
var score = 0

class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false)
        c.fillStyle = this.color
        c.fill()
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false)
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false)
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

var friction = 0.98
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }

    draw() {
        c.save()
        c.globalAlpha = 0.1
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.01
    }
}

var x = pad.width / 2
var y = pad.height / 2

var player, projectiles, enemies, particles

function init() {
    player = new Player(x, y, 30, 'white')
    projectiles = []
    enemies = []
    particles = []
    score = 0
    scoreEl.innerHTML = score
    bigScoreEl.innerHTML = score
}

function spawnEnemies() {
    setInterval(() => {
        let radius = Math.random() * (30 - 10) + 10
        let x, y
        
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : pad.width + radius
            y = Math.random() * pad.height
        }
        else {
            x = Math.random() * pad.width
            y = Math.random() < 0.5 ? 0 - radius : pad.height + radius
        }

        // compute hue before converting into a string using ${}
        let color = `hsl(${Math.random() * 360}, 50%, 50%)`
        
        let angle = Math.atan2(
            pad.height/2 - y,
            pad.width/2 - x
        )

        let velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 1000)
}

let animationId
function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    c.fillRect(0, 0, pad.width, pad.height)
    player.draw()
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        } else {
            particle.update()
        }
    })
    projectiles.forEach((projectile, index) => {
        projectile.update()

        if (projectile.x + projectile.radius < 0 || 
            projectile.x - projectile.radius > pad.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > pad.height) {
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }
    })
    enemies.forEach((enemy, index) => {
        enemy.update()
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)

        // end game
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId)
            modalEl.style.display = 'flex'
            bigScoreEl.innerHTML = score
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
            
            // when projectiles touch enemies
            if (dist - enemy.radius - projectile.radius < 1) {

                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, 
                        Math.random() * 2, 
                        enemy.color,
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 7),
                            y: (Math.random() - 0.5) * (Math.random() * 7)
                        }
                    ))
                }

                if (enemy.radius - 10 > 10) {
                    score += 100
                    scoreEl.innerHTML = score
                    enemy.radius -= 10
                    setTimeout(() => {
                    projectiles.splice(projectileIndex, 1)
                    }, 0)
                } else {
                    score += 250
                    scoreEl.innerHTML = score
                    setTimeout(() => {
                        enemies.splice(index, 1)
                        projectiles.splice(projectileIndex, 1)
                    }, 0)
                }
            }
        })
    })

}

// whenever we click we get back an event (in parentheses) 
// we can use the properties of the event to get our mouse coordinates
window.addEventListener('click', (event) => {
    const angle = Math.atan2(
        event.clientY - pad.height/2,
        event.clientX - pad.width/2
    )

    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    projectiles.push(
        new Projectile(pad.width/2, pad.height/2, 5, 'white', velocity)
    )
    console.log('add')
})

startGameBtn.addEventListener('click', () => {
    init()
    animate()
    spawnEnemies()
    modalEl.style.display = 'none'
})