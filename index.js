"use strict";
const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
context.scale(20, 20);

function arenaSweep() {

    let rowCount = 1;
    outer: for (let y = arena.length -1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if(arena[y][x] === 0) {

                continue outer;
            }
        }
        
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;

        linesCleared++;
        level = Math.floor(linesCleared / 10) + 1;
        dropInterval = Math.max(MIN_DROP_INTERVAL, BASE_DROP_INTERVAL - (level - 1) * SPEED_STEP);

    }
}

function collide(arena, player){
    const m = player.matrix;
    const o = player.pos;
    for(let y = 0; y < m.length; ++y) {
         for(let x = 0; x < m[y].length; ++x) { 
            if(m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0){
                return true;
            }
        }
    }

    return false;

}

function createMatrix(w,h){

    const matrix = [];
    while(h--){
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPlace(type){

    if(type === "I"){
        return[
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    }
    else if(type === "L"){
        return[
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2]
        ];
    }else if(type === "J"){
        return[
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0]
        ];
    }else if(type === "O"){
        return[
            [4, 4],
            [4, 4]
        ];
    }else if(type === "Z"){
        return[
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0]
        ];
    }else if(type === "S"){
        return[
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0]
        ];
    }else if(type === "T"){
        return[
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0]
        ];
    }else if(type === "V"){
        return[
            [0, 0, 8],
            [0, 8, 8],
            [0, 8, 0]
        ];
    }
}

function drawGrid() {
    const cols = arena[0].length;
    const rows = arena.length;

    context.strokeStyle = "rgba(255, 255, 255, 0.08)";
    context.lineWidth = 0.02;

    for (let x = 0; x <= cols; x++) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, rows);
        context.stroke();
    }

    for (let y = 0; y <= rows; y++) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(cols, y);
        context.stroke();
    }
}

function drawMatrix(matrix, offset) {

    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);

                context.strokeStyle = "#111";
                context.lineWidth = 0.08;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) =>{
        row.forEach((value, x) => {
            if(value !== 0){
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir){
    for(let y = 0; y < matrix.length; ++y){
        for(let x = 0; x<y; ++x){
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if(dir > 0){
        matrix.forEach(row => row.reverse());
    }else {
        matrix.reverse();
    }
}


function playerDrop(){

    player.pos.y++;
    if(collide(arena, player)){
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset){
    player.pos.x += offset;
    if(collide(arena, player)){
        player.pos.x -= offset;
    }
}

function playerReset(){

    const pieces = "TJLOSZIV";
    player.matrix = createPlace(pieces[(pieces.length * Math.random()) | 0]);
    player.pos.y = 0;
    player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
    if(collide(arena, player)){
        triggerGameOver();
    }
}

function triggerGameOver(){
    isGameOver = true;
    document.getElementById("final-score").innerText = player.score;
    document.getElementById("gameover-overlay").classList.remove("hidden");
}

function restartGame(){
    arena.forEach((row) => row.fill(0));
    player.score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = BASE_DROP_INTERVAL;
    isGameOver = false;
    document.getElementById("gameover-overlay").classList.add("hidden");
    updateScore();
    playerReset();
}

function playerRotate(dir){

    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while(collide(arena, player)){
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if(offset > player.matrix[0].length){
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

const BASE_DROP_INTERVAL = 700;
const MIN_DROP_INTERVAL = 100;
const SPEED_STEP = 55;

let dropCounter = 0;
let dropInterval = BASE_DROP_INTERVAL;
let lastTime = 0;
let isPaused = false;
let isGameOver = false;
let level = 1;
let linesCleared = 0;
let bestScore = Number(localStorage.getItem("tetrisBestScore")) || 0;

function togglePause() {
    isPaused = !isPaused;

    const btnPause = document.getElementById("btn-pause");
    btnPause.innerHTML = isPaused
        ? '<i data-feather="play"></i>'
        : '<i data-feather="pause"></i>';
    feather.replace();

    const overlay = document.getElementById("pause-overlay");
    overlay.classList.toggle("hidden", !isPaused);
}

function update(time = 0){
    if (isPaused || isGameOver) {
        requestAnimationFrame(update);
        return;
    }

    const delataTime = time - lastTime;
    dropCounter += delataTime;
    if(dropCounter > dropInterval){
        playerDrop();
    }
    lastTime = time;
    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById("score").innerText = "Score : " + player.score;
    document.getElementById("level-display").innerText = level;

    if (player.score > bestScore) {
        bestScore = player.score;
        localStorage.setItem("tetrisBestScore", bestScore);
    }
    document.getElementById("best-score-display").innerText = bestScore;
}

document.addEventListener("keydown", (event) => {
    if(event.key === "ArrowLeft" || event.key === "A" || event.key === "a") {
        playerMove(-1);
    }else if (event.key === "ArrowRight" || event.key === "D" || event.key === "d"){
        playerMove(1);
    }else if (event.key === "ArrowDown" || event.key === "S" || event.key === "s"){ 
        playerDrop();
    }else if (event.key === "ArrowUp" || event.key === "E" || event.key === "e") {
        playerRotate(-1);
    }else if (event.key  === "Q" || event.key === "q") {
        playerRotate(1);
    }else if (event.key === "p" || event.key === "P") {
        togglePause();
    }
});

function addHoldRepeat(button, action, repeatDelay = 120, initialDelay = 280) {
    let repeatIntervalId = null;
    let startTimeoutId = null;

    function start(event) {
        event.preventDefault();
        action();
        startTimeoutId = setTimeout(() => {
            repeatIntervalId = setInterval(action, repeatDelay);
        }, initialDelay);
    }

    function stop() {
        clearTimeout(startTimeoutId);
        clearInterval(repeatIntervalId);
        startTimeoutId = null;
        repeatIntervalId = null;
    }

    button.addEventListener("mousedown", start);
    button.addEventListener("touchstart", start, { passive: false });
    button.addEventListener("mouseup", stop);
    button.addEventListener("mouseleave", stop);
    button.addEventListener("touchend", stop);
    button.addEventListener("touchcancel", stop);
}

addHoldRepeat(document.getElementById("btn-left"), () => playerMove(-1));
addHoldRepeat(document.getElementById("btn-right"), () => playerMove(1));
addHoldRepeat(document.getElementById("btn-down"), () => playerDrop());
document.getElementById("btn-rotate-ccw").addEventListener("click", () => playerRotate(-1));
document.getElementById("btn-rotate-cw").addEventListener("click", () => playerRotate(1));
document.getElementById("btn-pause").addEventListener("click", () => togglePause());
document.getElementById("btn-restart").addEventListener("click", () => restartGame());

const colors = [
    null,
    "#ff0d72",
    "#0dc2ff",
    "#0dff72",
    "#f538ff",
    "#ff8e8d",
    "#ffe138",
    "#3877ff",
    "#ff9d00",
];

const arena = createMatrix(12, 20);
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

playerReset();
updateScore();
update();
