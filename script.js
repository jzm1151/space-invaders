const canvasHeightScale = .8; //The canvas height will be set to this * window.innerHeight
const canvas = document.querySelector('canvas');
const canvasContext = canvas.getContext('2d');

//These will be set every time a new game is started but
//they need to be global
let player;
let projectiles;
let enemies;

//This will store the interval used to create enemies
let enemiesInterval;

//A boolean variable that is used to determine if the 
//game is running or not
let playing = false;

//Text to be displayed before the score
//This is a bad practice
const textForScoreBoard = 'score: ';

//Will be updated by player to show current the current score
const scoreBoard = document.querySelector('.score-board');

class Vec2DNorm {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.normalize();
  }
  
  normalize() {
    const magnitude = Math.sqrt(this.x*this.x + this.y*this.y);
    this.x = this.x / magnitude;
    this.y = this.y / magnitude;
  }
}

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.score = 0;
    this.ammo = 25;
  }

  draw() {
    canvasContext.beginPath();
    canvasContext.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    canvasContext.fillStyle = this.color;
    canvasContext.fill();
  }

  updateScore() {
    const updateAmount = 1;
    this.score += updateAmount;
    scoreBoard.textContent = textForScoreBoard.concat(this.score);
  }

  hitByEnemy(enemy) {
    const distX = this.x - enemy.x;
    const distY = this.y - enemy.y;
    const dist = Math.sqrt(distX*distX + distY*distY);
    if (dist <= this.radius + enemy.radius) return true;
    else return false;
  }
}

class Projectile {
  constructor(x, y, radius, direction, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.direction = direction;
    this.color = color;
  }
  
  draw() {
    canvasContext.beginPath();
    canvasContext.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    canvasContext.fillStyle = this.color;
    canvasContext.fill();
  }
  
  update() {
    const rate = 7;
    this.x += this.direction.x * rate;
    this.y += this.direction.y * rate;
  }

  collisionWithEnemy(enemy) {
    const distX = this.x - enemy.x;
    const distY = this.y - enemy.y;
    const dist = Math.sqrt(distX*distX + distY*distY);
    if (dist <= this.radius + enemy.radius) return true;
    else return false;
  }

  outOfBounds() {
    if (canvas.width < this.x) return true;
    if (canvas.heigth < this.x) return true;
    if (this.x < 0) return true;
    if (this.y < 0) return true;
    return false;
  }
}

class Enemy {
  constructor(x, y, radius, direction, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.direction = direction;
    this.color = color;
  }
  
  draw() {
    canvasContext.beginPath();
    canvasContext.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    canvasContext.fillStyle = this.color;
    canvasContext.fill();
  }
  
  update() {
    const rate = 1.5;
    this.x += this.direction.x * rate;
    this.y += this.direction.y * rate;
  }

  hit() {
    this.radius -= 5;
    if (this.radius <= 10) return true;
    else return false;
  }

  outOfBounds() {
    if (canvas.width < this.x) return true;
    if (canvas.heigth < this.x) return true;
    if (this.x < 0) return true;
    if (this.y < 0) return true;
    return false;
  }

  static generateRandomEnemy(playerX, playerY) {
    const radiusRange = 30;
    const radiusMin = 15;
    const colors = ['yellow', 'green', 'purple', 'pink'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const choices = [
      [new Vec2DNorm(1, 0), [0, 0], Math.random() * canvas.width], // top
      [new Vec2DNorm(0, 1), [canvas.width, 0], Math.random() * canvas.height], // right
      [new Vec2DNorm(1, 0), [0, canvas.height], Math.random() * canvas.width], // bottom
      [new Vec2DNorm(0, 1), [0, 0], Math.random() * canvas.height] // left
    ];
    const choice = choices[Math.floor(Math.random() * choices.length)];
    const x = choice[0].x*choice[2] + choice[1][0];
    const y = choice[0].y*choice[2] + choice[1][1];
    const radius = Math.random()*radiusRange + radiusMin;
    const direction = new Vec2DNorm(playerX - x, playerY - y);
    return new Enemy(x, y, radius, direction, color);
  }
}

function gameLoop() {
  // removing projectiles that are out of bounds
  enemies.forEach((enemy) => {
    if (player.hitByEnemy(enemy)) {
        endGame();
        return;
      }
  });

  for (let i = projectiles.length-1; i >= 0; i--) {
    if (projectiles[i].outOfBounds()) projectiles.splice(i, 1);
  }

  //Removing projectiles and finished enemies if there is a collision
  for (let i = projectiles.length-1; i >= 0; i--) {
    for (let j = enemies.length-1; j >= 0; j--) {
      if (projectiles[i].collisionWithEnemy(enemies[j])) {
        player.updateScore();
        projectiles.splice(i, 1);
        if (enemies[j].hit()) enemies.splice(j, 1);
        j = -1; // leaving the inner loop after finished
      }
    }
  }

  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  player.draw();
  projectiles.forEach((projectile) => {
    projectile.update();
    projectile.draw();
  });

  enemies.forEach((enemy) => {
    enemy.update();
    enemy.draw();
  });

  window.requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', (event) => {
  //If the game is not running return
  if (!playing) return;

  const rect = canvas.getBoundingClientRect();
  const elementRelativeX = event.clientX - rect.left;
  const elementRelativeY = event.clientY - rect.top;
  let canvasRelativeX = elementRelativeX * canvas.width / rect.width;
  let canvasRelativeY = elementRelativeY * canvas.height / rect.height;
  canvasRelativeX = Math.max(canvasRelativeX, 0);
  canvasRelativeY = Math.max(canvasRelativeY, 0);
  const direction = new Vec2DNorm(canvasRelativeX - player.x,
                                   canvasRelativeY - player.y);
  const projectile = new Projectile(player.x, player.y, 5, direction, 'red');
  projectiles.push(projectile);
});

function endGame() {
  playing = false;
  player = null;
  projectiles = null;
  enemies = null;
  clearInterval(enemiesInterval);
}

function startGame() {
  //Making sure the canvas height is the correct size before starting
  canvas.height = window.innerHeight * canvasHeightScale;
  canvas.width = window.innerWidth;

  //Making sure the score displayed initially is 0
  scoreBoard.textContent = textForScoreBoard.concat(0);

  //Intializing objects needed in the game
  player = new Player(canvas.width/2, canvas.height/2, 10, 'blue');
  projectiles = [];
  enemies = [];
  
  //Starting the game
  gameLoop();
  enemiesInterval = setInterval(function () {
    enemies.push(Enemy.generateRandomEnemy(player.x, player.y));
  }, 2000);
  playing = true;
}







































//creating room