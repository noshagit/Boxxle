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
        alert("GG ! Tu accèdes au niveau suivant le sang");
        currentLevel = (currentLevel + 1) % Levels.length;
        level = JSON.parse(JSON.stringify(Levels[currentLevel]));
        findPlayer();
    }
};

// écoute les touches du clavier
//écoute les touches du clavier et bouge le joueur en fonction de la touche
//appelle la fonction movePlayer avec les coordonnées x et y
window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowUp":
            movePlayer(0, -1);
            break;
        case "ArrowDown":
            movePlayer(0, 1);
            break;
        case "ArrowLeft":
            movePlayer(-1, 0);
            break;
        case "ArrowRight":
            movePlayer(1, 0);
            break;
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



//efface la grille
//dessine une nouvelle grille
//appelle la fonction draw avec un requestAnimationFrame pour loop
const draw = () => {
    console.clear(); 
    highlightBoxesOnTarget();

    console.log(level.map(row => row.join(" ")).join("\n")); 

    setTimeout(() => requestAnimationFrame(draw), 1000 / fps);
};


// initialisation du jeu
findPlayer();
// commence le game loop
draw();
