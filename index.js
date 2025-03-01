// ======================================================================================================================================== //
//                                                                                                                                          //
//  Nom du fichier : index.js                                                                                                               //
//                                                                                                                                          //
// Description : Ce fichier contient l'intégralité des fonctionnalités lié à notre jeu, le déplacement du joueur,                           //
// la vérification de la victoire, la mise à jour de la grille, l'écoute des touches du clavier, la vérification de la présence du joueur,  //
// la vérification du mouvement du joueur, la vérification du mouvement de la boîte, la vérification de la victoire, la mise à jour du DOM, //
// la mise en évidence des boîtes sur les positions cibles, la boucle de jeu et la mise à jour de la grille.                                //
//                                                                                                                                          //
//========================================================================================================================================= //


// ------ IMPORTS ------ //

import { Levels } from "./level.js"; // Importe les niveaux

// ------ VARIABLES ------ //

const GRID_WIDTH = 50;
const GRID_HEIGHT = 25;
const fps = 10;
const gameContainer = document.getElementById("game-container"); // Récupère l'id du conteneur de jeu
let history = []; // Historique des mouvements

const keys = { //définition des touches (flèches)
    37: "left",
    39: "right",
    38: "up",
    40: "down",
};

let currentLevel = 0; // Niveau de départ
let level = JSON.parse(JSON.stringify(Levels[currentLevel])); // Deep copy pour éviter les modifications sur le niveau d'origine
let playerPos = { x: 0, y: 0 }; // Position du joueur

// ------ FONCTIONS ------ //

const findPlayer = () => { // Trouve la position du joueur et modifie sa position
    for (let y = 0; y < level.length; y++) { // Parcours la grille
        for (let x = 0; x < level[y].length; x++) { 
            if (level[y][x] === 3) { // Si la case est le joueur
                playerPos = { x, y }; // Met à jour la position du joueur
                return;
            }
        }
    }
};

const checkPlayerPresence = () => { // Vérifie si le joueur est présent
    let playerFound = false; // Par défaut, le joueur n'est pas trouvé

    for (let y = 0; y < level.length; y++) { // Parcours la grille
        for (let x = 0; x < level[y].length; x++) {
            if (level[y][x] === 3) { // Si la case est le joueur
                playerFound = true; // Le joueur est trouvé
                break;
            }
        }
    }

    if (!playerFound) { // Si le joueur n'est pas trouvé
        alert("Pas de joueur"); // Alerte
        return false;
    }

    return true;
};

const canMove = (x, y) => { // Vérifie si le joueur peut bouger
    return level[y] && level[y][x] !== 1; // Vérifie si la case n'est pas un mur et si elle est dans la grille
};

const canPushBox = (x, y, dx, dy) => { // Vérifie si le joueur peut pousser une boîte
    return level[y] && level[y][x] === 2 && canMove(x + dx, y + dy) && level[y + dy][x + dx] !== 2; // Vérifie si la case est une boîte, si le mouvement est valide, et si la case suivante n'est pas une autre boîte
};

const movePlayer = (dx, dy) => { // Déplace le joueur
    const newX = playerPos.x + dx; // Nouvelle position x
    const newY = playerPos.y + dy; // Nouvelle position y

    if (canMove(newX, newY)) { // Vérifie si le joueur peut bouger
        history.push(JSON.parse(JSON.stringify(level)));
        if (level[newY][newX] === 2) { // Si la case suivante est une boîte
            const boxX = newX + dx; // Nouvelle position x de la boîte
            const boxY = newY + dy; // Nouvelle position y de la boîte
            if (canPushBox(newX, newY, dx, dy)) { // Vérifie si le joueur peut pousser la boîte
                level[boxY][boxX] = 2; // Déplace la boîte
                level[newY][newX] = 3; // Déplace le joueur
                level[playerPos.y][playerPos.x] = Levels[currentLevel][playerPos.y][playerPos.x] === 4 ? 4 : 0; // Met à jour la position du joueur
                playerPos = { x: newX, y: newY }; // Met à jour la position du joueur
            }
        } else { // Si la case suivante n'est pas une boîte
            level[newY][newX] = 3; // Déplace le joueur
            level[playerPos.y][playerPos.x] = Levels[currentLevel][playerPos.y][playerPos.x] === 4 ? 4 : 0; // Met à jour la position du joueur
            playerPos = { x: newX, y: newY }; // Met à jour la position du joueur
        }
    }

    updateDOM(); // Met à jour le DOM
    checkWin(); // Vérifie si le joueur a gagné
};

const checkWin = () => { // Vérifie si le joueur a gagné
    let win = true; // Par défaut, le joueur a gagné
    for (let y = 0; y < level.length; y++) { // Parcours la grille
        for (let x = 0; x < level[y].length; x++) {
            if (Levels[currentLevel][y][x] === 4 && level[y][x] !== 2) { // Si la case est un emplacement et qu'elle n'a pas de boîte
                win = false; // Le joueur n'a pas gagné
            }
        }
    }
    if (win) { // Si le joueur a gagné
        alert("Congratulations! You completed the level."); // Alerte
        currentLevel = (currentLevel + 1) % Levels.length; // Passe au niveau suivant
        history = [];
        level = JSON.parse(JSON.stringify(Levels[currentLevel])); // Deep copy pour éviter les modifications sur le niveau d'origine
        findPlayer(); // Trouve la position du joueur
        updateDOM(); // Met à jour le DOM
    }
};

const updateDOM = () => { // Met à jour le DOM
    gameContainer.innerHTML = ""; // Vide le conteneur de jeu
    gameContainer.style.gridTemplateColumns = `repeat(${level[0].length}, ${GRID_WIDTH}px)`; // Met à jour le nombre de colonnes
    gameContainer.style.gridTemplateRows = `repeat(${level.length}, ${GRID_HEIGHT}px)`; // Met à jour le nombre de lignes

    for (let y = 0; y < level.length; y++) { // Parcours la grille
        for (let x = 0; x < level[y].length; x++) {
            const cell = document.createElement("div"); // Crée une cellule
            cell.classList.add("cell"); // Ajoute la classe cell
            cell.dataset.x = x; // Ajoute les coordonnées x et y
            cell.dataset.y = y;
            
            if (level[y][x] === 1) { // Si la case est un mur
                cell.classList.add("wall"); // Ajoute la classe wall
            } else if (level[y][x] === 2) { // Si la case est une boîte
                cell.classList.add("box"); // Ajoute la classe box
            } else if (level[y][x] === 3) { // Si la case est le joueur
                cell.classList.add("player"); // Ajoute la classe player
            } else if (level[y][x] === 4) { // Si la case est un emplacement
                cell.classList.add("target"); // Ajoute la classe target
            }
            
            gameContainer.appendChild(cell); // Ajoute la cellule au conteneur de jeu
        }
    }

    highlightBoxesOnTarget(); // Met en évidence les boîtes sur les positions cibles
};

window.addEventListener("keydown", (e) => { // Ecoute les touches du clavier
    if (e.key === "ArrowUp") { // Si la touche est flèche du haut
        movePlayer(0, -1); // Déplace le joueur
    } else if (e.key === "ArrowDown") { // Si la touche est flèche du bas
        movePlayer(0, 1); // Déplace le joueur
    } else if (e.key === "ArrowLeft") { // Si la touche est flèche de gauche
        movePlayer(-1, 0); // Déplace le joueur
    } else if (e.key === "ArrowRight") { // Si la touche est flèche de droite
        movePlayer(1, 0); // Déplace le joueur
    }
});

const highlightBoxesOnTarget = () => { // Met en évidence les boîtes sur les positions cibles
    const boxes = document.querySelectorAll(".box"); // Récupère toutes les boîtes

    boxes.forEach(box => { // Parcours les boîtes
        const x = parseInt(box.dataset.x); // Récupère les coordonnées x et y
        const y = parseInt(box.dataset.y);

        if (Levels[currentLevel][y][x] === 4) { // Si la case est un emplacement
            box.style.backgroundColor = "green"; // Met en évidence la boîte
        } else { // Si la case n'est pas un emplacement
            box.style.backgroundColor = "brown"; // Ne met pas en évidence la boîte
        }
    });
};

// Fonction pour le reset du niveau
const resetLevel = () => {
    level = JSON.parse(JSON.stringify(Levels[currentLevel])); // recommence le level
    findPlayer(); // Update la position du joeuru
    updateDOM(); // reload la grid
};

//load spécifique level
const loadLevel = (nb) => {
    level = JSON.parse(JSON.stringify(Levels[nb])); // recommence le level
    findPlayer(); // Update la position du joeuru
    updateDOM(); // reload la grid
};

// Fonction pour revenir en arrière sur le dernier movement
const undoLastMove = () => {
    if (history.length > 0) {
        level = history.pop(); // Reviens au move d'avant
        findPlayer(); // Update la position du joeuru
        updateDOM(); // update l'état du jeu
    }
};

const draw = () => { // Boucle de jeu
    updateDOM(); // Met à jour le DOM
    setTimeout(() => requestAnimationFrame(draw), 1000 / fps); // Met à jour le jeu
};

if (checkPlayerPresence()) { // Vérifie si le joueur est présent
    findPlayer(); // Trouve la position du joueur
    draw(); // Démarre la boucle
}

// ------ CREATIONS EXTRA BOUTON ------ //

// Crée un bouton de reset
window.addEventListener("DOMContentLoaded", () => {
    const resetButton = document.createElement("button"); //crée l'élément bouton
    resetButton.textContent = "Reset le niveau"; //texte dans le bouton
    resetButton.id = "reset-button"; //Son id
    document.body.appendChild(resetButton); //l'ajoute au body
    resetButton.addEventListener("click", resetLevel); //lui ajoute un event listener, ici la fonction resetLevel
});

// Crée un bouton retour en arrière
window.addEventListener("DOMContentLoaded", () => {
    const undoButton = document.createElement("button");
    undoButton.textContent = "Revenir en arrière";
    undoButton.id = "undo-button";
    document.body.appendChild(undoButton);
    undoButton.addEventListener("click", undoLastMove);
});