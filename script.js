function animateCaseShuffle() {
  const cases = document.querySelectorAll(".case");
  let i = 0;
  const shuffleInterval = setInterval(() => {
    if (i >= cases.length) {
      clearInterval(shuffleInterval);
      return;
    }
    cases[i].classList.add("shuffling");
    setTimeout(() => cases[i].classList.remove("shuffling"), 500);
    i++;
  }, 50);
}


function triggerBankerCall() {
  const phoneMessage = document.createElement("div");
  phoneMessage.id = "banker-call";
  phoneMessage.textContent = "Ring... Ring... The Banker is calling!";
  document.body.appendChild(phoneMessage);

  document.getElementById("bankerCall").play();

  // Vibrate if supported (mobile)
  if (navigator.vibrate) {
    navigator.vibrate([300, 100, 300]);
  }

  // Fade it in
  setTimeout(() => {
    phoneMessage.style.opacity = "1";
    phoneMessage.style.transform = "scale(1.05)";
  }, 100);

  // Fade it out after 2.5s
  setTimeout(() => {
    phoneMessage.style.opacity = "0";
    phoneMessage.style.transform = "scale(0.8)";
  }, 2500);

  // Remove element completely after fade out
  setTimeout(() => phoneMessage.remove(), 3000);

  // Then show the offer
  setTimeout(() => {
    document.getElementById("beforeOffer").play();
    const offerModal = document.getElementById("offerModal");
    offerModal.classList.add("from-phone");
    offerModal.style.display = "flex";
    setTimeout(() => offerModal.classList.remove("from-phone"), 600);
  }, 2600);
}

function launchConfetti() {
  const canvas = document.createElement("canvas");
  canvas.id = "confetti-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);
  const confetti = window.confetti.create(canvas, { resize: true });
  confetti({
    particleCount: 200,
    spread: 100,
    origin: { y: 0.6 }
  });
  setTimeout(() => canvas.remove(), 5000);
}


const values = [0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400,
  500, 750, 1000, 5000, 10000, 25000, 50000, 75000,
  100000, 200000, 300000, 400000, 500000, 750000, 1000000];
let shuffled = [...values].sort(() => Math.random() - 0.5);
let selected = null, opened = 0, dealGiven = false;
let wallet = 10000;
let offerCount = 0;

const walletDisplay = document.getElementById("wallet");
const casesDiv = document.getElementById("cases");
const boardDiv = document.getElementById("moneyBoard");
const status = document.getElementById("status");
const offer = document.getElementById("offer");
const dealBtn = document.getElementById("dealButton");
const resetBtn = document.getElementById("resetBtn");
const difficultySelect = document.getElementById("difficulty");

const openSound = document.getElementById("openSound");
const dealSound = document.getElementById("dealSound");
const revealSound = document.getElementById("revealSound");

function updateWallet(amount) {
  wallet += amount;
  walletDisplay.textContent = "Wallet: $" + wallet;
}

function initGame() {
  casesDiv.innerHTML = "";
  boardDiv.innerHTML = "";
  offerCount = 0;
  shuffled = [...values].sort(() => Math.random() - 0.5);
  selected = null; opened = 0; dealGiven = false;
  status.textContent = "Pick your case.";
  offer.textContent = "";
  dealBtn.disabled = true;

  values.forEach(v => {
    const val = document.createElement("div");
    val.classList.add("money-amount");
    val.classList.add("money-amount");
    val.textContent = "$" + v;
    boardDiv.appendChild(val);
  });

  shuffled.forEach((_, i) => {
    const btn = document.createElement("div");
    btn.className = "case";
    btn.textContent = i + 1;
    btn.onclick = () => pickCase(i, btn);
    casesDiv.appendChild(btn);
    if (i === 25) setTimeout(animateCaseShuffle, 200);
  });

  // 👇 Play "Choose your case" voice prompt
  document.getElementById("chooseCaseSound").play();
}



function pickCase(i, btn) {
  if (selected === null) {
    selected = i;
    btn.classList.add("opened");
    btn.textContent = "YOURS";
    status.textContent = "Start opening the other cases.";
    document.getElementById("beforePick").play(); // <- this is your pick-case.mp3 sound
  } else if (!btn.classList.contains("opened")) {
    btn.classList.add("opened");
    btn.classList.add("revealing");
    setTimeout(() => { btn.textContent = "$" + shuffled[i]; }, 300);
    openSound.play();
    opened++;

    if (shuffled[i] > 100000) {
      document.getElementById("hitSound").play();
    }


    [...boardDiv.children].forEach(child => {
      if (child.textContent === "$" + shuffled[i]) {
        child.classList.remove("money-amount");
        child.classList.add("money-crossed");
      }
    });

    const offerMilestones = [6, 11, 17, 23];
    if (offerMilestones.includes(opened) && offerCount < 4) {
      offerDeal();
    } else if (opened === 25) {
      status.textContent = "Only your case remains!";
      dealBtn.disabled = true;
      finalReveal();
    }
  }
}



function offerDeal() {
  triggerBankerCall();
  offerCount++;

  const remaining = shuffled.filter((_, i) =>
    i !== selected && !casesDiv.children[i].classList.contains("opened")
  );
  const avg = remaining.reduce((a, b) => a + b, 0) / remaining.length;
  const difficulty = difficultySelect.value;
  const multiplier = difficulty === "easy" ? 1 : difficulty === "hard" ? 0.7 : 0.9;
  const deal = Math.floor(avg * multiplier);

  // Show offer in modal popup
  document.getElementById("offerAmount").textContent = `Banker offers you: $${deal.toLocaleString()}`;


  // Accept Offer
  document.getElementById("acceptOffer").onclick = () => {
    document.getElementById("offerModal").style.display = "none";
    status.textContent = "You took the deal: $" + deal.toLocaleString();
    if (realPlay) updateWallet(deal - 500); // Subtract $500 play cost
    finalReveal(true, deal); // Show what was in your case
  };

  // Reject Offer
  document.getElementById("rejectOffer").onclick = () => {
    document.getElementById("offerModal").style.display = "none";
    status.textContent = "No Deal! Keep playing...";
  };
}

function finalReveal(dealTaken = false, dealAmount = 0) {
  const yourVal = shuffled[selected];
  revealSound.play();
  if (!dealTaken) {
    status.textContent = "You win: $" + yourVal;
    if (yourVal >= 100000) launchConfetti();
    if (realPlay) updateWallet(yourVal - 500);
  } else {
    status.textContent += " | Your case had: $" + yourVal;
    if (yourVal >= 100000) launchConfetti();
  }
}

resetBtn.onclick = initGame;
const themeSelect = document.getElementById("themeSelect");
const themes = ["default", "light", "neon", "christmas", "halloween", "stpatricks"];

themeSelect.onchange = () => {
  const selectedTheme = themeSelect.value;
  document.body.classList.remove(...themes);
  if (selectedTheme !== "default") {
    document.body.classList.add(selectedTheme);
  }
};


let realPlay = true;

function showModePopup() {
  const modePopup = document.createElement("div");
  modePopup.style.position = "fixed";
  modePopup.style.top = "0";
  modePopup.style.left = "0";
  modePopup.style.width = "100%";
  modePopup.style.height = "100%";
  modePopup.style.backgroundColor = "rgba(0,0,0,0.8)";
  modePopup.style.display = "flex";
  modePopup.style.flexDirection = "column";
  modePopup.style.justifyContent = "center";
  modePopup.style.alignItems = "center";
  modePopup.style.zIndex = "1000";
  modePopup.innerHTML = `
    <div style="background:#222; padding:20px; border-radius:10px; text-align:center;">
      <h2 style="color:white;">Choose Game Mode</h2>
      <button id="realBtn" style="margin:10px; padding:10px 20px;">Real Mode</button>
      <button id="freeBtn" style="margin:10px; padding:10px 20px;">Practice Mode</button>
    </div>
  `;
  document.body.appendChild(modePopup);

  document.getElementById("realBtn").onclick = () => {
    bgMusic.loop = true;
    bgMusic.play();
    realPlay = true;
    document.body.removeChild(modePopup);
    initGame();
  };
  document.getElementById("freeBtn").onclick = () => {
    bgMusic.loop = true;
    bgMusic.play();
    realPlay = false;
    document.body.removeChild(modePopup);
    initGame();
  };
}

function sprinkle(icon = "💵") {
  const el = document.createElement("div");
  el.className = "sprinkle";
  el.textContent = icon;
  el.style.left = Math.random() * 100 + "vw";
  el.style.animationDuration = 3 + Math.random() * 2 + "s";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

// Sprinkle every few seconds depending on theme
setInterval(() => {
  const theme = document.body.className;
  if (theme.includes("christmas")) {
    sprinkle("🎁");
    sprinkle("💵");
  } else if (theme.includes("neon")) {
    sprinkle("🧊");
    sprinkle("💵");
  } else if (theme.includes("halloween")) {
    sprinkle("🍬");
    sprinkle("💵");
  } else if (theme.includes("stpatricks")) {
    sprinkle("☘️");
    sprinkle("💵");
  } else {
    sprinkle("💵");
  }
}, 5000);


showModePopup();

function toggleMenu() {
  const menu = document.querySelector('.controls');
  menu.classList.toggle('show');
}

document.getElementById("offerModal").onclick = (e) => {
  if (e.target.id === "offerModal") {
    document.getElementById("offerModal").style.display = "none";
  }
};