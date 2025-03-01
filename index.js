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

let keys = { // Définit les touches par défaut (flèches)
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
};
let isListeningForKey = false; // Empêche les mouvements lorsqu'on modifie une touche

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
    if (checkPlayerPresence()) {
        history = [];
        level = JSON.parse(JSON.stringify(Levels[currentLevel])); // recommence le level
        findPlayer(); // Update la position du joeuru
        updateDOM(); // reload la grid
    } else {
        currentLevel = 0;
        level = JSON.parse(JSON.stringify(Levels[currentLevel])); // recommence le level
    }
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

// Fonction pour vérifier si la touche est déjà utilisée par un autre contrôle
const isKeyUsed = (key, excludeControl) => { 
    return Object.entries(keys).some(([control, assignedKey]) => assignedKey === key && control !== excludeControl);
};

// Fonction pour mettre à jour les contrôles personnalisés
const updateCustomControls = (control, newKey) => {
    if (isKeyUsed(newKey, control)) { // Vérifie si la touche est déjà utilisée
        alert(`The key "${newKey}" is already assigned to another action.`); // Alerte l'utilisateur
        return;// Ne modifie rien
    } 

    keys[control] = newKey; // Met à jour la touche du contrôle
    document.getElementById(`${control}-key`).textContent = newKey; // Met à jour le texte du bouton
};

// Fonction pour écouter les touches du clavier
const listenForKeyPress = (control) => {
    isListeningForKey = true; // Empêche les mouvements lorsqu'on modifie une touche

    const onKeyDown = (event) => { // Fonction pour écouter les touches du clavier
        event.stopPropagation(); // Empêche la propagation de l'événement
        event.preventDefault(); // Empêche le comportement par défaut

        updateCustomControls(control, event.key); // Met à jour les contrôles personnalisés
        isListeningForKey = false; // Autorise les mouvements de nouveau

        document.removeEventListener("keydown", onKeyDown); // Arrête d'écouter les touches du clavier
    };

    document.addEventListener("keydown", onKeyDown); // Écoute les touches du clavier
};

const resetMovementControls = () => { // Réinitialise les contrôles de mouvement
    keys = { // Définit les touches par défaut (flèches)
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
    };
    document.getElementById("up-key").textContent = keys.up;
    document.getElementById("down-key").textContent = keys.down;
    document.getElementById("left-key").textContent = keys.left;
    document.getElementById("right-key").textContent = keys.right;
};


// Crée un bouton de reset
window.addEventListener("DOMContentLoaded", () => {
    const resetButton = document.createElement("button"); //crée l'élément bouton
    resetButton.textContent = "Réinitialiser le niveau"; //texte dans le bouton
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

const handlePlayerMovement = (event) => { // Fonction pour gérer le mouvement du joueur
    if (isListeningForKey) return; // Ignore movement if changing controls

    switch (event.key) { // Vérifie la touche pressée
        case keys.up: movePlayer(0, -1); break; // Déplace le joueur vers le haut
        case keys.down: movePlayer(0, 1); break; // Déplace le joueur vers le bas
        case keys.left: movePlayer(-1, 0); break; // Déplace le joueur vers la gauche
        case keys.right: movePlayer(1, 0); break; // Déplace le joueur vers la droite
    }
};

window.addEventListener("keydown", (event) => { // Écoute les touches du clavier
    handlePlayerMovement(event); // Gère le mouvement du joueur
    if (event.key === "Backspace") undoLastMove(); // Reviens en arrière
    if (event.key === "Escape") resetLevel(); // Reset le niveau
});

const createControlCustomizationForm = () => { // Crée un formulaire pour personnaliser les contrôles
    const controlForm = document.createElement("div"); // Crée un élément div
    controlForm.innerHTML = `
        <label for="up-key">Touche Haut: </label><button id="up-key">${keys.up}</button><br>
        <label for="down-key">Touche Bas: </label><button id="down-key">${keys.down}</button><br>
        <label for="left-key">Touche Gauche: </label><button id="left-key">${keys.left}</button><br>
        <label for="right-key">Touche Droite: </label><button id="right-key">${keys.right}</button><br>
    `; // Ajoute des boutons pour personnaliser les contrôles
    document.body.appendChild(controlForm); // Ajoute le formulaire au body

    // Ajoute un event listener pour chaque bouton
    document.getElementById("up-key").addEventListener("click", () => listenForKeyPress('up'));
    document.getElementById("down-key").addEventListener("click", () => listenForKeyPress('down'));
    document.getElementById("left-key").addEventListener("click", () => listenForKeyPress('left'));
    document.getElementById("right-key").addEventListener("click", () => listenForKeyPress('right'));
};

// Crée le formulaire de personnalisation des contrôles
window.addEventListener("DOMContentLoaded", createControlCustomizationForm);

// Crée un bouton retour en arrière
window.addEventListener("DOMContentLoaded", () => {
    const keyButton = document.createElement("button");
    keyButton.textContent = "Réinitialiser les contrôles";
    keyButton.id = "reset-key-button";
    document.body.appendChild(keyButton);
    keyButton.addEventListener("click", resetMovementControls);
});