const opciones = ["piedra","papel","tijera"];

const icons = {
  piedra:`<svg viewBox="0 0 64 64"><path fill="currentColor" d="M12 30q2-14 14-18t22 6q8 8 6 20t-12 16q-10 4-20-2t-10-22z"/></svg>`,
  papel:`<svg viewBox="0 0 64 64"><rect x="14" y="8" width="36" height="48" rx="4" fill="currentColor"/></svg>`,
  tijera:`<svg viewBox="0 0 64 64"><path fill="currentColor" d="M20 20l24 24m0-24L20 44m-6-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm36 0a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/></svg>`
};

function compare(j1,j2){
  if(j1===j2) return "empate";
  if((j1==="piedra"&&j2==="tijera")||(j1==="tijera"&&j2==="papel")||(j1==="papel"&&j2==="piedra"))
    return `gana ${j1}`;
  return `gana ${j2}`;
}

let score={jugador:0,maquina:0};
let eleccionJugador=null;

const choiceButtons=[...document.querySelectorAll('.choice-btn')],
      playBtn=document.getElementById('playBtn'),
      autoBtn=document.getElementById('autoBtn'),
      resetBtn=document.getElementById('resetBtn'),
      resultadoEl=document.getElementById('resultado'),
      machineIcon=document.getElementById('machineIcon'),
      scoreJugadorEl=document.getElementById('score-jugador'),
      scoreMaquinaEl=document.getElementById('score-maquina');

function setSelected(choice){
  eleccionJugador=choice;
  choiceButtons.forEach(btn=>{
    btn.setAttribute('aria-pressed', btn.dataset.choice===choice?'true':'false');
  });
  playBtn.disabled=false;
  playBtn.removeAttribute('aria-disabled');
}

choiceButtons.forEach(btn=>btn.addEventListener('click',()=>setSelected(btn.dataset.choice)));

function animateMachine(duration=900){
  const start=Date.now();let idx=0;
  machineIcon.innerHTML='...';
  const t=setInterval(()=>{
    idx=(idx+1)%opciones.length;
    machineIcon.innerHTML=icons[opciones[idx]];
    if(Date.now()-start>=duration) clearInterval(t);
  },120);
  return new Promise(res=>setTimeout(res,duration));
}

function pickMachine(){
  return opciones[Math.floor(Math.random()*opciones.length)];
}

async function playRound(playerChoice){
  if(!playerChoice){resultadoEl.textContent='Selecciona una jugada primero.';return;}
  playBtn.disabled=true;playBtn.setAttribute('aria-disabled','true');

  await animateMachine();
  const maquina=pickMachine();
  machineIcon.innerHTML=icons[maquina];

  const res=compare(playerChoice,maquina);
  if(res==='empate'){
    resultadoEl.textContent='Empate — nadie suma punto.';
    saveResult(playerChoice, maquina, "empate");
  } else if(res.includes(playerChoice)){
    resultadoEl.textContent=`Has ganado: ${res}`;
    score.jugador++;
    saveResult(playerChoice, maquina, "victoria");
  } else {
    resultadoEl.textContent=`Has perdido: ${res}`;
    score.maquina++;
    saveResult(playerChoice, maquina, "derrota");
  }

  scoreJugadorEl.textContent=`Tú: ${score.jugador}`;
  scoreMaquinaEl.textContent=`Máquina: ${score.maquina}`;
  localStorage.setItem('rps-score',JSON.stringify(score));

  playBtn.disabled=false;
  playBtn.removeAttribute('aria-disabled');
}

// Cargar marcador guardado
try{
  const saved=JSON.parse(localStorage.getItem('rps-score'));
  if(saved){score=saved;}
  scoreJugadorEl.textContent=`Tú: ${score.jugador}`;
  scoreMaquinaEl.textContent=`Máquina: ${score.maquina}`;
}catch(e){}

// Botones
playBtn.addEventListener('click',()=>playRound(eleccionJugador));
autoBtn.addEventListener('click',()=>{
  const r=opciones[Math.floor(Math.random()*opciones.length)];
  setSelected(r);playRound(r);
});
resetBtn.addEventListener('click',()=>{
  score={jugador:0,maquina:0};
  localStorage.removeItem('rps-score');
  scoreJugadorEl.textContent=`Tú: 0`;
  scoreMaquinaEl.textContent=`Máquina: 0`;
  resultadoEl.textContent='Marcador reiniciado.';
  machineIcon.innerHTML='—';
});

// ---- Conexión al backend en Vercel (MongoDB) ----
async function saveResult(player, machine, result){
  try {
    await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, machine, result, ts: Date.now() })
    });
  } catch(e){
    console.error("Error guardando en backend:", e);
  }
}
