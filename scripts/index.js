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

const GRID_WIDTH = 50; // Définit la taille des cases
const GRID_HEIGHT = 25; // Définit la taille des cases
const fps = 10; // Définit les images par seconde
const gameContainer = document.getElementById("game-container"); // Récupère l'id du conteneur de jeu

let keys = { // Définit les touches par défaut (flèches)
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
};
let history = []; // Historique des mouvements
let isListeningForKey = false; // Empêche les mouvements lorsqu'on modifie une touche
let currentLevel = 0; // Niveau de départ
let level = JSON.parse(JSON.stringify(Levels[currentLevel])); // Deep copy pour éviter les modifications sur le niveau d'origine
let playerPos = { x: 0, y: 0 }; // Position du joueur
let walkingCounter = 0; // Compteur de pas
let score = 0; // Score
let playerSpriteIndex = 1; // Index de l'image du joueur

// ------ AUDIO ------ //

// Créer l'élément audio
const audio = document.createElement("audio");
audio.id = "audio";
audio.volume = 0.15; // Volume initial
audio.style.display = "none"; // On masque la balise audio
document.body.appendChild(audio); // Ajouter l'élément audio au body

// Créer le conteneur pour les boutons et le slider de volume
const container = document.getElementById("audio-container");

// Bouton Play/Pause
const playPauseButton = document.createElement("button");
playPauseButton.innerHTML = "▶️";
playPauseButton.onclick = function() {
    if (audio.paused) {
        audio.play();
        playPauseButton.innerHTML = "⏸️";
    } else {
        audio.pause();
        playPauseButton.innerHTML = "▶️";
    }
};

// Ajouter le bouton Play/Pause au conteneur
container.appendChild(playPauseButton);

// Bouton Stop
const stopButton = document.createElement("button");
stopButton.innerHTML = "⏹️";
stopButton.onclick = function() {
    audio.pause();
    audio.currentTime = 0; // Remettre la lecture à zéro
    playPauseButton.innerHTML = "▶️"; // Change le bouton Play/Pause à ▶️
};

// Ajouter les éléments au conteneur
container.appendChild(playPauseButton);
container.appendChild(stopButton);

// Variables de contrôle de la playlist
let audioFiles = [];
let currentFileIndex = 0;

// Charger les fichiers audio depuis un fichier .txt
async function loadAudioFiles() {
    try {
        const response = await fetch('/musics/songsList.txt'); // Charger le fichier texte
        const text = await response.text(); // Récupérer le contenu du fichier
        audioFiles = text.split('\n').map(file => file.trim()).filter(file => file !== '');

        if (audioFiles.length > 0) {
            // Utiliser le premier fichier de la liste (par exemple)
            audio.src = audioFiles[currentFileIndex];
        } else {
            console.error("Aucun fichier audio trouvé dans le fichier texte.");
        }

        // Mettre à jour le fichier audio quand la chanson actuelle est terminée
        audio.addEventListener('ended', function() {
            currentFileIndex = (currentFileIndex + 1) % audioFiles.length;
            if (currentFileIndex === 0) {
                console.log("Fin de la playlist, on recommence !");
            }
            audio.src = audioFiles[currentFileIndex];
            audio.play();
        });

    } catch (error) {
        console.error("Erreur lors du chargement du fichier audio : ", error);
    }
}

// Charger la liste des fichiers audio au démarrage
loadAudioFiles();

// Bouton Next (passer à la chanson suivante)
const nextButton = document.createElement("button");
nextButton.innerHTML = "Suivant ⏭️";
nextButton.onclick = function() {
    currentFileIndex = (currentFileIndex + 1) % audioFiles.length;
    audio.src = audioFiles[currentFileIndex];
    audio.play();
    playPauseButton.innerHTML = "⏸️";
    if (audio.paused) {
        playPauseButton.innerHTML = "▶️";
    }
};

// Bouton Previous (revenir à la chanson précédente)
const prevButton = document.createElement("button");
prevButton.innerHTML = "Précédent ⏮️";
prevButton.onclick = function() {
    currentFileIndex = (currentFileIndex - 1 + audioFiles.length) % audioFiles.length;
    audio.src = audioFiles[currentFileIndex];
    audio.play();
    playPauseButton.innerHTML = "⏸️";
    if (audio.paused) {
        playPauseButton.innerHTML = "▶️";
    }
};

// Ajouter les boutons Next et Previous au conteneur
container.appendChild(prevButton);
container.appendChild(nextButton);

// Afficher le temps écoulé et la durée totale
const timeDisplay = document.createElement("div");
timeDisplay.id = "time-display";
container.appendChild(timeDisplay);

audio.addEventListener('timeupdate', () => {
    const currentTime = formatTime(audio.currentTime);
    const duration = formatTime(audio.duration);
    timeDisplay.textContent = `${currentTime} / ${duration}`;
});

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Attacher la fonction changeState à window pour pouvoir l'utiliser
window.changeState = function(action) {
    if (action === "play") {
        audio.play();
    } else if (action === "pause") {
        audio.pause();
    } else if (action === "stop") {
        audio.pause();
        audio.currentTime = 0;
    }
};

// ------ SOUND EFFECTS ------ //

const walk = new Audio('/sounds/walk.mp3');
const resetgamesound = new Audio('/sounds/resetLevel.mp3');
const box = new Audio('/sounds/box.mp3');
walk.volume = 0.2; // Volume initial
resetgamesound.volume = 0.2; // Volume initial
box.volume = 0.2; // Volume initial

// Fonction pour jouer le son avec un volume de 20%
function walkingSound() {
    walk.play();        // Jouer le son
}

// Fonction pour jouer le son avec un volume de 20%
function boxSound() {
    box.play();        // Jouer le son
}

// Fonction pour jouer le son avec un volume de 20%
function resetSound() {
    resetgamesound.play();        // Jouer le son
}

// ------ FONCTIONS ------ //

const updatePlayerSprite = () => {
    playerSpriteIndex = playerSpriteIndex < 3 ? playerSpriteIndex + 1 : 2;
    document.documentElement.style.setProperty('--player-image', `url('/images/player${playerSpriteIndex}.png')`);
};

const resetPlayerSprite = () => {
    playerSpriteIndex = 1;
    document.documentElement.style.setProperty('--player-image', `url('/images/player${playerSpriteIndex}.png')`);
}

// Met à jour l'affichage du compteur de pas
const updateWalkingCounterDisplay = () => {
    const walkingCounterDisplay = document.getElementById("walking-counter-display");
    if (walkingCounterDisplay) {
        walkingCounterDisplay.textContent = "Nombres de pas : " + walkingCounter;
    }
};

// Met à jour l'affichage du compteur de pas
const updateScoreDisplay = () => {
    const scoreDisplay = document.getElementById("score-display");
    if (scoreDisplay) {
        scoreDisplay.textContent = "Votre score : " + score;
    }
};

// Incrémente le compteur de pas
const increaseWalkingCounter = () => {
    walkingCounter++; // Incrémente le compteur de pas
    updateWalkingCounterDisplay(); // Met à jour l'affichage du compteur de pas
}

// Réinitialise le compteur de pas
const resetWalkingCounter = () => {
    walkingCounter = 0; // Réinitialise le compteur de pas
    updateWalkingCounterDisplay(); // Met à jour l'affichage du compteur de pas
}

// Incrémente le score
const modifyScore = () => {
    score += walkingCounter;
    updateScoreDisplay();
}

// Décrémente le score
const increaseScore2 = () => {
    score += 2;
    updateScoreDisplay();
}

// Décrémente le score
const increaseScore5 = () => {
    score += 5;
    updateScoreDisplay();
}

// Trouve la position du joueur et modifie sa position
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
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    // Vérifie si la case suivante est une boîte
    if (level[newY][newX] === 2) {
        const boxX = newX + dx;
        const boxY = newY + dy;

        // Vérifie si la boîte peut être poussée
        if (canPushBox(newX, newY, dx, dy)) {
            history.push(JSON.parse(JSON.stringify(level))); // Sauvegarde l'état de la grille
            level[boxY][boxX] = 2; // Déplace la boîte
            level[newY][newX] = 3; // Déplace le joueur
            level[playerPos.y][playerPos.x] = Levels[currentLevel][playerPos.y][playerPos.x] === 4 ? 4 : 0; // Met à jour la case précédente du joueur
            playerPos = { x: newX, y: newY }; // Met à jour la position du joueur

            increaseWalkingCounter(); // Incrémente le compteur de pas
            boxSound(); // Joue le son de boîte
            updatePlayerSprite(); // Change l'image du joueur
        }
        return;
    }

    // Vérifie si le joueur peut bouger normalement (sans boîte)
    if (canMove(newX, newY)) {
        history.push(JSON.parse(JSON.stringify(level))); // Sauvegarde l'état de la grille
        level[newY][newX] = 3; // Déplace le joueur
        level[playerPos.y][playerPos.x] = Levels[currentLevel][playerPos.y][playerPos.x] === 4 ? 4 : 0; // Met à jour la case précédente du joueur
        playerPos = { x: newX, y: newY }; // Met à jour la position du joueur

        increaseWalkingCounter(); // Incrémente le compteur de pas
        walkingSound(); // Joue le son de pas
        updatePlayerSprite(); // Change l'image du joueur
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
        modifyScore(); // Incrémente le compteur de pas
        resetWalkingCounter(); // Réinitialise le compteur de pas
        resetPlayerSprite(); // Réinitialise l'image du joueur
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

        if (Levels[currentLevel][y][x] === 4) { // If the box is on a target
            box.style.backgroundImage = "url('/images/boxValidate.png')"; // Change to validated box image
        } else { // If the box is not on a target
            box.style.backgroundImage = "url('/images/box.png')"; // Keep the normal box image
        }
        
    });
};

// Fonction pour le reset du niveau
const resetLevel = () => {
    increaseScore5(); // Incrémente le score
    resetSound(); // Joue le son de reset
    updateScoreDisplay(); // Met à jour le score
    if (checkPlayerPresence()) {
        history = [];
        level = JSON.parse(JSON.stringify(Levels[currentLevel])); // recommence le level
        findPlayer(); // Update la position du joeuru
        updateDOM(); // reload la grid
    } else {
        currentLevel = 0;
        level = JSON.parse(JSON.stringify(Levels[currentLevel])); // recommence le level
    }
    modifyScore(); // Incrémente le score
    resetWalkingCounter(); // Réinitialise le compteur de pas
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
        increaseScore2(); // Incrémente le score
        walkingSound(); // Joue le son de pas
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
    if (key.length === 1) { // Si la touche est une seule lettre
        key = key.toLowerCase(); // Convertis uniquement les touches d'une seule lettre (lettres) en minuscules
    }
    // Vérifie si la touche est déjà utilisée par un autre contrôle
    return Object.entries(keys).some(([control, assignedKey]) => assignedKey === key && control !== excludeControl);
};

// Fonction pour mettre à jour les contrôles personnalisés
const updateCustomControls = (control, newKey) => {
    if (newKey.length === 1) { // Si la touche est une seule lettre
        newKey = newKey.toLowerCase(); // Convert only single-character keys (letters) to lowercase
    }

    if (isKeyUsed(newKey, control)) { // Vérifie si la touche est déjà utilisée par un autre contrôle
        alert(`The key "${newKey}" is already assigned to another action.`); // Alerte
        return; // Arrête la fonction
    } 

    keys[control] = newKey; // Met à jour les contrôles personnalisés
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

const handlePlayerMovement = (event) => {
    if (isListeningForKey) return; // Empêche les mouvements lorsqu'on modifie une touche

    let keyPressed = event.key; // Récupère la touche pressée
    if (keyPressed.length === 1) { // Si la touche est une seule lettre
        keyPressed = keyPressed.toLowerCase(); // Convertis uniquement les touches d'une seule lettre (lettres) en minuscules
    }

    switch (keyPressed) { // Gère le mouvement du joueur
        case keys.up: movePlayer(0, -1); break; // Déplace le joueur vers le haut
        case keys.down: movePlayer(0, 1); break; // Déplace le joueur vers le bas
        case keys.left: movePlayer(-1, 0); break; // Déplace le joueur vers la gauche
        case keys.right: movePlayer(1, 0); break; // Déplace le joueur vers la droite
    }
};

// ------ EVENT LISTENERS ------ //

window.addEventListener("keydown", (event) => { // Écoute les touches du clavier
    handlePlayerMovement(event); // Gère le mouvement du joueur
    if (event.key === "Backspace") undoLastMove(); // Reviens en arrière
    if (event.key === "Escape") resetLevel(); // Reset le niveau
});

// Crée une div pour contenir tous les boutons et le formulaire
window.addEventListener("DOMContentLoaded", () => {
    const controlsContainer = document.createElement("div");
    controlsContainer.id = "controls-container";
    document.body.appendChild(controlsContainer);

    // Crée un bouton de reset
    const resetButton = document.createElement("button");
    resetButton.textContent = "Réinitialiser le niveau";
    resetButton.id = "reset-button";
    document.body.appendChild(resetButton);
    resetButton.addEventListener("click", resetLevel);

    // Crée un bouton retour en arrière
    const undoButton = document.createElement("button");
    undoButton.textContent = "Revenir en arrière";
    undoButton.id = "undo-button";
    document.body.appendChild(undoButton);
    undoButton.addEventListener("click", undoLastMove);

    // Crée un formulaire pour personnaliser les contrôles
    const controlForm = document.createElement("div");
    controlForm.innerHTML = `
        <label for="up-key">Touche Haut: </label><button id="up-key">${keys.up}</button><br>
        <label for="down-key">Touche Bas: </label><button id="down-key">${keys.down}</button><br>
        <label for="left-key">Touche Gauche: </label><button id="left-key">${keys.left}</button><br>
        <label for="right-key">Touche Droite: </label><button id="right-key">${keys.right}</button><br>
    `;
    controlsContainer.appendChild(controlForm);

    // Crée un bouton pour réinitialiser les contrôles
    const keyButton = document.createElement("button");
    keyButton.textContent = "Réinitialiser les contrôles";
    keyButton.id = "reset-key-button";
    controlsContainer.appendChild(keyButton);
    keyButton.addEventListener("click", resetMovementControls);

    // Crée un menu burger
    const burgerMenu = document.createElement("div");
    burgerMenu.id = "burger-menu";
    burgerMenu.innerHTML = `
        <div id="burger-icon">&#9776; Options</div>
        <div id="burger-content" style="display: none;">
            ${controlsContainer.innerHTML}
        </div>
    `;
    document.body.appendChild(burgerMenu);

    // Ajoute un event listener pour le menu burger
    document.getElementById("burger-icon").addEventListener("click", () => {
        const burgerContent = document.getElementById("burger-content");
        burgerContent.style.display = burgerContent.style.display === "none" ? "block" : "none";
    });

    // Déplace les éléments du conteneur de contrôles dans le contenu du menu burger
    controlsContainer.innerHTML = '';

    // Ajoute un event listener pour chaque bouton
    document.getElementById("up-key").addEventListener("click", () => listenForKeyPress('up'));
    document.getElementById("down-key").addEventListener("click", () => listenForKeyPress('down'));
    document.getElementById("left-key").addEventListener("click", () => listenForKeyPress('left'));
    document.getElementById("right-key").addEventListener("click", () => listenForKeyPress('right'));
    document.getElementById("reset-key-button").addEventListener("click", resetMovementControls);

    // Ajoute les sliders de volume pour la musique et les effets sonores
    const musicVolumeSlider = document.createElement("input");
    musicVolumeSlider.type = "range";
    musicVolumeSlider.min = "0";
    musicVolumeSlider.max = "1";
    musicVolumeSlider.step = "0.01";
    musicVolumeSlider.value = audio.volume;
    musicVolumeSlider.oninput = function(event) {
        audio.volume = event.target.value;
    };
    musicVolumeSlider.onmouseup = function() {
        musicVolumeSlider.blur();
    };

    const effectsVolumeSlider = document.createElement("input");
    effectsVolumeSlider.type = "range";
    effectsVolumeSlider.min = "0";
    effectsVolumeSlider.max = "1";
    effectsVolumeSlider.step = "0.02";
    effectsVolumeSlider.oninput = function(event) {
        walk.volume = event.target.value;
        resetgamesound.volume = event.target.value;
        box.volume = event.target.value;
    };
    effectsVolumeSlider.onmouseup = function() {
        effectsVolumeSlider.blur();
    };

    const volumeControls = document.createElement("div");
    volumeControls.innerHTML = `
        <label for="music-volume">Volume Musique: </label>
        <input id="music-volume" type="range" min="0" max="1" step="0.01" value="${audio.volume}"><br>
        <label for="effects-volume">Volume Effets Sonores: </label>
        <input id="effects-volume" type="range" min="0" max="1" step="0.01" value="${walk.volume}">
    `;
    volumeControls.querySelector("#music-volume").addEventListener("input", musicVolumeSlider.oninput);
    volumeControls.querySelector("#music-volume").addEventListener("mouseup", musicVolumeSlider.onmouseup);
    volumeControls.querySelector("#effects-volume").addEventListener("input", effectsVolumeSlider.oninput);
    volumeControls.querySelector("#effects-volume").addEventListener("mouseup", effectsVolumeSlider.onmouseup);

    document.getElementById("burger-content").appendChild(volumeControls);
});

// Affiche le compteur de pas et le score
window.addEventListener("DOMContentLoaded", () => {
    const displayContainer = document.createElement("div");
    displayContainer.id = "display-container";

    const walkingCounterDisplay = document.createElement("div");
    walkingCounterDisplay.id = "walking-counter-display";
    walkingCounterDisplay.textContent = "Nombres de pas : " + walkingCounter;

    const scoreDisplay = document.createElement("div");
    scoreDisplay.id = "score-display";
    scoreDisplay.textContent = "Votre score : " + score;

    displayContainer.appendChild(walkingCounterDisplay);
    displayContainer.appendChild(scoreDisplay);
    document.body.appendChild(displayContainer);
});
