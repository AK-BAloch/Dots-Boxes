const boardEl   = document.getElementById("board");
const sizeSel   = document.getElementById("sizeSelect");
const newBtn    = document.getElementById("newGameBtn");
const scoreAEl  = document.getElementById("scoreA");
const scoreKEl  = document.getElementById("scoreK");
const turnText  = document.getElementById("turnText");

let B = parseInt(sizeSel.value, 10);
let gridSide;
let edges = {};
let boxes = {};
let current = "A";
let scoreA = 0, scoreK = 0;
let remainingEdges = 0;

newBtn.addEventListener("click", () => start(+sizeSel.value));
sizeSel.addEventListener("change", () => start(+sizeSel.value));

start(B);

function start(b){
  B = b;
  gridSide = 2 * B + 1;
  edges = {};
  boxes = {};
  current = "A";
  scoreA = 0; scoreK = 0;
  scoreAEl.textContent = "0";
  scoreKEl.textContent = "0";
  remainingEdges = 0;

  buildGrid();
  turnText.textContent = `Turn: ${current}`;
}

function buildGrid(){
  boardEl.innerHTML = "";

  const dotSize = 16;
  const edgeThickness = 10;
  const boxMin = 52;
  const tracks = [];

  for(let i=0;i<gridSide;i++){
    if(i % 2 === 0) tracks.push(`${dotSize}px`);
    else tracks.push(`minmax(${edgeThickness}px, ${boxMin}px)`);
  }
  boardEl.style.display = "grid";
  boardEl.style.gridTemplateColumns = tracks.join(" ");
  boardEl.style.gridTemplateRows    = tracks.join(" ");

  for(let r=0;r<gridSide;r++){
    for(let c=0;c<gridSide;c++){
      const isEvenR = (r % 2 === 0);
      const isEvenC = (c % 2 === 0);

      if(isEvenR && isEvenC){
        const d = div("dot");
        cell(d, r, c);
      } else if(isEvenR && !isEvenC){
        const key = `h-${r}-${c}`;
        const e = div("edge h");
        e.dataset.key = key;
        e.addEventListener("click", onEdgeClick);
        cell(e, r, c);
        edges[key] = { taken:false, by:null, neighbors:[] };
        remainingEdges++;
      } else if(!isEvenR && isEvenC){
        const key = `v-${r}-${c}`;
        const e = div("edge v");
        e.dataset.key = key;
        e.addEventListener("click", onEdgeClick);
        cell(e, r, c);
        edges[key] = { taken:false, by:null, neighbors:[] };
        remainingEdges++;
      } else {
        const key = `b-${r}-${c}`;
        const b = div("box");
        b.dataset.key = key;
        cell(b, r, c);
        boxes[key] = { owner:null, edges:[] };
      }
    }
  }

  for(let r=1; r<gridSide; r+=2){
    for(let c=1; c<gridSide; c+=2){
      const bKey = `b-${r}-${c}`;
      const eTopKey = `h-${r-1}-${c}`;
      const eBotKey = `h-${r+1}-${c}`;
      const eLeftKey = `v-${r}-${c-1}`;
      const eRightKey = `v-${r}-${c+1}`;

      boxes[bKey].edges.push(eTopKey, eRightKey, eBotKey, eLeftKey);
      [eTopKey, eRightKey, eBotKey, eLeftKey].forEach(k=>{
        edges[k].neighbors.push(bKey);
      });
    }
  }
}

function onEdgeClick(e){
  const key = e.currentTarget.dataset.key;
  const edge = edges[key];
  if(edge.taken) return;

  edge.taken = true;
  edge.by = current;
  e.currentTarget.classList.add("taken", current);

  let claimedAny = false;
  for(const bKey of edge.neighbors){
    if(checkAndClaimBox(bKey, current)){
      claimedAny = true;
    }
  }

  if(claimedAny){
    updateScores();
  } else {
    current = current === "A" ? "K" : "A";
    turnText.textContent = `Turn: ${current}`;
  }

  remainingEdges--;
  if(remainingEdges === 0){
    endGame();
  }
}

function checkAndClaimBox(bKey, player){
  const box = boxes[bKey];
  if(box.owner) return false;

  const allTaken = box.edges.every(k => edges[k].taken);
  if(allTaken){
    box.owner = player;
    const el = document.querySelector(`.box[data-key="${bKey}"]`);
    el.classList.add(player);
    el.textContent = player;
    el.style.scale = "1.05";
    setTimeout(()=> el.style.scale = "1", 90);
    return true;
  }
  return false;
}

function updateScores(){
  let a=0,k=0;
  for(const b of Object.values(boxes)){
    if(b.owner === "A") a++;
    else if(b.owner === "K") k++;
  }
  scoreA = a; scoreK = k;
  scoreAEl.textContent = scoreA;
  scoreKEl.textContent = scoreK;
  turnText.textContent = `Turn: ${current}`;
}

function endGame(){
  if(scoreA > scoreK) turnText.textContent = `A wins! 🎉  (A: ${scoreA} — K: ${scoreK})`;
  else if(scoreK > scoreA) turnText.textContent = `K wins! 🎉  (A: ${scoreA} — K: ${scoreK})`;
  else turnText.textContent = `Draw!  (A: ${scoreA} — K: ${scoreK})`;
}

function cell(el, r, c){
  el.style.gridRow = r + 1;
  el.style.gridColumn = c + 1;
  boardEl.appendChild(el);
}
function div(cls){ const el = document.createElement("div"); el.className = cls; return el; }
