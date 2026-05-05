
/*Boutons Jouer des dofférentes pages html*/ 
const Bouton3 = document.getElementById("Jouer3");

if (Bouton3) {
  Bouton3.addEventListener("click", function () {
    window.location.href = "test_personnalite.html";
  });
}

const Bouton1 = document.getElementById("Jouer1");

if (Bouton1) {
  Bouton1.addEventListener("click", function () {
    window.location.href = "WatchOut/WatchOut.html";
  });
}

const Bouton2 = document.getElementById("Jouer2");

if (Bouton2) {
  Bouton2.addEventListener("click", function () {
    // Bien utiliser le fichier VBL_game.html dans le dossir multijoueur, pour pouvoir jouer en réseau.
    window.location.href = "VeryBadLands/VBL_multiplayer/VBL_game.html";
  });
}


/*La montre et sa flèche vers différentes époques*/ 

let angle =0;
function tourner() {
  angle += 10;
  document.getElementById("fleche").style.transform =
    `translate(-50%, -50%) rotate(${angle}deg)`;
}


function allerVersEpoque() {

console.log("ANGLE GLOBAL =", angle);
console.log("ANGLE NORMALISE =", angle % 360);

  let angleNormalise = angle % 360;
  if (angleNormalise < 0) angleNormalise += 360;


  if (angleNormalise >= 0 && angleNormalise < 30) {
    window.location.href = "epoque1.html";
  } 
  else if (angleNormalise >= 30 && angleNormalise < 150) {
    window.location.href = "epoque2.html";
  } 
  else if (angleNormalise >= 150 && angleNormalise < 270) {
    window.location.href = "epoque3.html";
  }
  else if (angleNormalise >= 270 && angleNormalise < 390) {
    window.location.href = "epoque1.html";
  }
}


const fleche = document.getElementById("fleche");
let rotationActive = false;



fleche.addEventListener("mousedown", () => {
  rotationActive = true;
});

fleche.addEventListener("mouseup", () => {
  rotationActive = false;

  allerVersEpoque();
});

document.addEventListener("mousemove", (e) => {
  if (!rotationActive) return;

  const rect = fleche.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = e.clientX - centerX;
  const dy = e.clientY - centerY;

  angle = Math.atan2(dy, dx) * (180 / Math.PI);

  fleche.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
});

/*#################### TEST Personnalité #################"*/ 

function calculerResultat() {
  let score = 0;
  const form = document.getElementById("quizForm");
  const data = new FormData(form);

  for (let value of data.values()) {
    score += parseInt(value);
  }

  let resultat = "";
  const img = document.getElementById("img_resultat");

  if (score < 5) {
    resultat = "Veuillez répondre à toutes les questions :)";

  } 
  else if(score <= 7) {
    resultat = "Tu es un Brachiosaure ! Calme, réfléchi(e) et pacifique.";
    img.style.display = "block";
    img.src = "images/brachiosaure.webp";

  } else if (score <= 11) {
    resultat = "Tu es un Pteranodon ! Intelligent(e), adaptable et stratégique.";
    img.style.display = "block";
    img.src = "images/Pteranodon.jpg";

  } else {
    resultat = "Tu es un Tyrannosaurus Rex ! Puissant(e) et audacieux(se).";
    img.style.display = "block";
    img.src = "images/Tyrannosaure_Rex.webp";
  }

  document.getElementById("resultat").textContent = resultat;
}