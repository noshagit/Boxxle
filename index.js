import { Levels } from "./level.js"; //importe les niveaux

//définitions des variables
const GRID_WIDTH = 50;
const GRID_HEIGHT = 25;
const fps = 10;
const keys = { //définition des touches (flèches)
    37: "left",
    39: "right",
    38: "up",
    40: "down",
};

//Initialise le level
let currentLevel = 0;
let level = JSON.parse(JSON.stringify(Levels[currentLevel])); // deep copy pour éviter les modifs sur le niveau original
let playerPos = { x: 0, y: 0 }; //stock la position du joueur
const gameContainer = document.getElementById("game-container");

//trouver la position du joueur
//cherche où est le joueur (numéro 3) dans la grid puis update playerPos
const findPlayer = () => {
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            if (level[y][x] === 3) {
                playerPos = { x, y };
                return;
            }
        }
    }
};

const checkPlayerPresence = () => {
    let playerFound = false;
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            if (level[y][x] === 3) {
                playerFound = true;
                break;
            }
        }
    }
    if (!playerFound) {
        alert("Pas de joueur");
        return false;
    }
    return true;
};

// vérifie si le joueur peut bouger
//vérifie si la case est un mur (1) ou si elle est en dehors de la grille
//si le mouvement est valide, true, sinon false
const canMove = (x, y) => {
    return level[y] && level[y][x] !== 1;
};

// vérifie si le joueur peut pousser une boîte
//vérifie si la case est une boîte (2) et si le mouvement est valide
//vérifie si la case suivante contiens une boite (numéro 2), si la case x + dx est un mur (numérot 1) ou si la case y + dy est un mur (numéro 1)
//si le mouvement est valide, true, sinon false
const canPushBox = (x, y, dx, dy) => {
    return level[y] && level[y][x] === 2 && canMove(x + dx, y + dy) && level[y + dy][x + dx] !== 2;
};

// déplace le joueur
//bouge le joueur si la prochaine case est pas un mur
//SI il y a une boite, vérifie si le joueur peut la pousser
//si le joueur peut pousser la boite, la boite est déplacée
//si rien, bouge juste le joueur
//check si victoire
const movePlayer = (dx, dy) => {
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (canMove(newX, newY)) {
        if (level[newY][newX] === 2) {
            const boxX = newX + dx;
            const boxY = newY + dy;
            if (canPushBox(newX, newY, dx, dy)) {
                level[boxY][boxX] = 2;
                level[newY][newX] = 3;
                level[playerPos.y][playerPos.x] = 0;
                playerPos = { x: newX, y: newY };
            }
        } else {
            level[newY][newX] = 3;
            level[playerPos.y][playerPos.x] = 0;
            playerPos = { x: newX, y: newY };
        }
    }

    updateDOM();
    checkWin();
};

// vérifie si le joueur a gagné
//parcourt la grille et vérifie si tous les emplacements (numéro 4) ont un boites (numéro 2)
//si oui, alerte victoire et passe au niveau suivant
const checkWin = () => {
    let win = true;
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            if (Levels[currentLevel][y][x] === 4 && level[y][x] !== 2) {
                win = false;
            }
        }
    }
    if (win) {
        alert("Congratulations! You completed the level.");
        currentLevel = (currentLevel + 1) % Levels.length;
        level = JSON.parse(JSON.stringify(Levels[currentLevel]));
        findPlayer();
        updateDOM();
    }
};

const updateDOM = () => {
    gameContainer.innerHTML = "";
    
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            if (level[y][x] === 1) {
                cell.classList.add("wall");
            } else if (level[y][x] === 2) {
                cell.classList.add("box");
            } else if (level[y][x] === 3) {
                cell.classList.add("player");
            } else if (level[y][x] === 4) {
                cell.classList.add("target");
            }
            
            // Add the cell to the grid
            gameContainer.appendChild(cell);
        }
    }

    highlightBoxesOnTarget(); // Highlight boxes on target positions
};

// écoute les touches du clavier
//écoute les touches du clavier et bouge le joueur en fonction de la touche
//appelle la fonction movePlayer avec les coordonnées x et y
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
        movePlayer(0, -1);
    } else if (e.key === "ArrowDown") {
        movePlayer(0, 1);
    } else if (e.key === "ArrowLeft") {
        movePlayer(-1, 0);
    } else if (e.key === "ArrowRight") {
        movePlayer(1, 0);
    }
});

//prends toutes les boites
//si sur un emplacement, la mets en vert, sinon marron
const highlightBoxesOnTarget = () => {
    const boxes = document.querySelectorAll(".box");

    boxes.forEach(box => {
        const x = parseInt(box.dataset.x);
        const y = parseInt(box.dataset.y);

        if (Levels[currentLevel][y][x] === 4) {
            box.style.backgroundColor = "green";
        } else {
            box.style.backgroundColor = "brown";
        }
    });
};



//game loop avec grid update
const draw = () => {
    updateDOM();
    setTimeout(() => requestAnimationFrame(draw), 1000 / fps);
};


//si y'a un joueur commence le loop
if (checkPlayerPresence()) {
    findPlayer();
    draw(); // Start the game loop
}
