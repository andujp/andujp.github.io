
/*
 * CUBE / PORTFOLIO
 * A dependency-free 3D portfolio that uses CSS-transformed DOM surfaces.
 *
 * First edit the CONFIG fields below. No build tools required.
 */
const CONFIG = {
  email: '',        // Example: 'hello@example.com'
  linkedIn: '',     // Optional future link
  github: '',       // Optional future link
  resume: ''        // Optional future PDF link
};

const PROJECTS = {
  fundpilot: {
    label: 'HACKATHON · 2026',
    title: 'FundPilot-AI',
    description: 'An exploratory hackathon prototype for small nonprofits handling micro-grants and reimbursements. It presents transactions, payroll records, supporting documents and suggested funding allocations in a review-friendly Streamlit interface. The prototype includes a pre-evaluated demonstration scenario, not a live production AI service.',
    tags: ['Python', 'Streamlit', 'UI/UX', 'Document workflows']
  },
  eloquia: {
    label: 'RESEARCH · 2026',
    title: 'Collaboration analytics',
    description: 'A UC Berkeley Data Discovery student collaboration investigating the identification and evaluation of group-work behaviors from meeting transcripts. The work involves behavior definitions, contextual annotations, evaluation procedures, and consideration of how useful feedback should be presented.',
    tags: ['Research', 'Python', 'Human-centered AI', 'Evaluation']
  },
  ants: {
    label: 'COURSEWORK · 2026',
    title: 'Ants vs. SomeBees',
    description: 'A strategy simulation project from UC Berkeley CS 61A. Implementing interacting insect types and game rules is a practical exercise in Python object-oriented design, inheritance, state changes, and debugging.',
    tags: ['Python', 'OOP', 'CS 61A']
  }
};

const body = document.body;
const voidView = document.querySelector('#voidView');
const stage = document.querySelector('#roomStage');
const shell = document.querySelector('#roomShell');
const faces = [...document.querySelectorAll('.room-face')];
const names = ['ABOUT', 'EXPERIENCE', 'PROJECTS', 'LAB'];
const navLinks = [...document.querySelectorAll('[data-goto]')];
const navButtons = [...document.querySelectorAll('.inside-navigation [data-goto]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let inside = false;
let transitioning = false;
let steps = 0;
let drag = null;
let lastWheel = 0;
let transitionTimeout;
const wrap = (n, length = 4) => ((n % length) + length) % length;
const activeFace = () => faces[wrap(steps)];
function updateDepth() {
  // A face is exactly the width of the stage, so depth = width/2.
  stage.style.setProperty('--depth', `${stage.clientWidth / 2}px`);
}
function drawRotation(extraDegrees = 0) {
  shell.style.transform = `translateZ(calc(-1 * var(--depth))) rotateY(${(-90 * steps + extraDegrees)}deg)`;
}
function updateRoomUI() {
  const index = wrap(steps);
  faces.forEach((face, i) => {
    const current = i === index;
    face.classList.toggle('is-current', current);
    face.setAttribute('aria-hidden', String(!current));
    face.inert = !current;
  });
  if (index === 3 && reducedMotion.matches && inside) requestAnimationFrame(() => renderField(0));
  navButtons.forEach(button => {
    const current = Number(button.dataset.goto) === index;
    button.classList.toggle('is-active', current);
    if (current) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.querySelector('#roomName').textContent = `${String(index).padStart(2, '0')} / ${names[index]}`;
  document.querySelector('#stepCount').textContent = `${String(index + 1).padStart(2, '0')} / 04`;
}
function rotateBy(direction) {
  if (!inside || transitioning) return;
  steps += direction;
  updateRoomUI();
  drawRotation();
  transitioning = true;
  clearTimeout(transitionTimeout);
  transitionTimeout = setTimeout(() => { transitioning = false; }, reducedMotion.matches ? 20 : 1390);
}
function gotoRoom(target) {
  if (!inside || transitioning) return;
  target = wrap(target);
  const current = wrap(steps);
  if (target === current) return;
  let delta = target - current;
  if (delta > 2) delta -= 4;
  if (delta < -2) delta += 4;
  rotateBy(delta);
}

// The cube stays in the center. Dragging changes its 3D orientation,
// not its position. Releasing gives the spin a gentle inertial finish.
const cubeTrigger = document.querySelector('#cubeTrigger');
const cubeMotion = document.querySelector('#cubeMotion');
const introCube = document.querySelector('.intro-cube');
const bound = (v, low, high) => Math.min(high, Math.max(low, v));
const ENTER_MS = 1240;
const EXIT_MS = 1000;
let cubePose = { pitch: -18, yaw: -32 };
let cubeDrag = null;
let suppressCubeClick = false;
let spinFrame = null;
let cubeTransitioning = false;
let entryAnimations = [];

function renderCube() {
  introCube.style.transform = `rotateX(${cubePose.pitch}deg) rotateY(${cubePose.yaw}deg)`;
}
function stopSpin() {
  if (spinFrame !== null) cancelAnimationFrame(spinFrame);
  spinFrame = null;
}
function coastSpin(pitchSpeed, yawSpeed) {
  stopSpin();
  if (reducedMotion.matches) return;
  let last = performance.now();
  function advance(now) {
    const dt = Math.min(40, now - last);
    last = now;
    cubePose.yaw += yawSpeed * dt;
    cubePose.pitch = bound(cubePose.pitch + pitchSpeed * dt, -78, 78);
    // Frame-rate independent decay. No abrupt stop.
    const damping = Math.pow(.90, dt / 16.67);
    yawSpeed *= damping;
    pitchSpeed *= damping;
    renderCube();
    if (Math.abs(yawSpeed) + Math.abs(pitchSpeed) > .004) spinFrame = requestAnimationFrame(advance);
    else spinFrame = null;
  }
  spinFrame = requestAnimationFrame(advance);
}

cubeTrigger.addEventListener('pointerdown', event => {
  if (event.button !== 0 || cubeTransitioning || inside) return;
  stopSpin();
  cubeDrag = {
    id: event.pointerId, x: event.clientX, y: event.clientY,
    prevX: event.clientX, prevY: event.clientY, time: performance.now(),
    startYaw: cubePose.yaw, startPitch: cubePose.pitch,
    vy: 0, vp: 0, moved: false
  };
  cubeMotion.classList.add('is-dragging');
  try { cubeTrigger.setPointerCapture(event.pointerId); } catch (_) {}
});
cubeTrigger.addEventListener('pointermove', event => {
  if (!cubeDrag || event.pointerId !== cubeDrag.id) return;
  const dx = event.clientX - cubeDrag.x;
  const dy = event.clientY - cubeDrag.y;
  if (!cubeDrag.moved && Math.hypot(dx, dy) < 6) return;
  cubeDrag.moved = true;
  cubePose.yaw = cubeDrag.startYaw + dx * .66;
  cubePose.pitch = bound(cubeDrag.startPitch - dy * .56, -78, 78);
  const now = performance.now();
  const dt = Math.max(8, now - cubeDrag.time);
  cubeDrag.vy = bound((event.clientX - cubeDrag.prevX) * .66 / dt, -.35, .35);
  cubeDrag.vp = bound((cubeDrag.prevY - event.clientY) * .56 / dt, -.35, .35);
  cubeDrag.prevX = event.clientX;
  cubeDrag.prevY = event.clientY;
  cubeDrag.time = now;
  renderCube();
});
function releaseCube(event, cancelled = false) {
  if (!cubeDrag || event.pointerId !== cubeDrag.id) return;
  const wasDragged = cubeDrag.moved;
  const {vy, vp, time} = cubeDrag;
  cubeDrag = null;
  cubeMotion.classList.remove('is-dragging');
  try { if (cubeTrigger.hasPointerCapture(event.pointerId)) cubeTrigger.releasePointerCapture(event.pointerId); } catch (_) {}
  if (wasDragged) {
    suppressCubeClick = true;
    if (!cancelled && performance.now() - time < 100) coastSpin(vp, vy);
    // Prevent the synthetic click from entering after a spin.
    setTimeout(() => { suppressCubeClick = false; }, 60);
  }
}
cubeTrigger.addEventListener('pointerup', event => releaseCube(event));
cubeTrigger.addEventListener('pointercancel', event => releaseCube(event, true));
cubeTrigger.addEventListener('click', event => {
  if (suppressCubeClick || cubeTransitioning) { event.preventDefault(); return; }
  enterCube();
});
// Arrow keys rotate the focused cube; Enter/Space click normally.
cubeTrigger.addEventListener('keydown', event => {
  if (cubeTransitioning || inside || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  stopSpin();
  if (event.key === 'ArrowLeft') cubePose.yaw -= 45;
  if (event.key === 'ArrowRight') cubePose.yaw += 45;
  if (event.key === 'ArrowUp') cubePose.pitch = bound(cubePose.pitch - 25, -78, 78);
  if (event.key === 'ArrowDown') cubePose.pitch = bound(cubePose.pitch + 25, -78, 78);
  renderCube();
});
// Mouse wheel over the cube turns it, instead of moving it in 2D space.
cubeTrigger.addEventListener('wheel', event => {
  if (inside || cubeTransitioning) return;
  event.preventDefault();
  stopSpin();
  cubePose.yaw += bound(event.deltaY * .18, -55, 55);
  renderCube();
}, {passive:false});

// HYPERSPACE ENGINE
// We drive camera distance, cube alignment, and radial light streaks using
// the SAME animation clock. That prevents the separate, jerky zoom / tunnel
// timing seen in earlier prototypes.
const warpCanvas = document.querySelector('#warpCanvas');
const warpCtx = warpCanvas.getContext('2d', {alpha:true});
const warpRays = Array.from({length:145}, (_,i) => ({
  angle: (i * 2.399963229728653) + Math.random() * .42,
  position: .05 + Math.random() * .66,
  depth: .25 + Math.random() * .85,
  length: .6 + Math.random() * .8,
  tint: Math.random()
}));
let warpWidth=1, warpHeight=1;
function sizeWarpCanvas(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  warpWidth = Math.max(1,window.innerWidth);
  warpHeight = Math.max(1,window.innerHeight);
  warpCanvas.width = Math.round(warpWidth*dpr);
  warpCanvas.height = Math.round(warpHeight*dpr);
  warpCtx.setTransform(dpr,0,0,dpr,0,0);
}
function smoothStep(a,b,t){
  const x = bound((t-a)/(b-a),0,1);
  return x*x*(3-2*x);
}
function drawWarp(progress){
  warpCtx.clearRect(0,0,warpWidth,warpHeight);
  const inAmount = smoothStep(.20,.66,progress);
  const outAmount = 1-smoothStep(.96,1,progress);
  const strength = inAmount*outAmount;
  if(strength <= .005) return;
  const cx=warpWidth/2, cy=warpHeight/2;
  const edge=Math.hypot(cx,cy);
  const advance=Math.pow(progress,2.15);
  warpCtx.save();
  warpCtx.globalCompositeOperation='lighter';
  for(const ray of warpRays){
    const radius=edge*(ray.position*.8+advance*ray.depth*1.40);
    if(radius>edge*1.35)continue;
    const length=(8+120*advance)*ray.length*ray.depth;
    const x=Math.cos(ray.angle), y=Math.sin(ray.angle);
    const a=warpCtx.createLinearGradient(cx+x*(radius-length),cy+y*(radius-length),cx+x*radius,cy+y*radius);
    const alpha=(.14+ray.depth*.30)*strength;
    const rgb=ray.tint>.77?'192,173,236':'146,208,238';
    a.addColorStop(0,`rgba(${rgb},0)`);
    a.addColorStop(1,`rgba(${rgb},${alpha})`);
    warpCtx.strokeStyle=a;
    warpCtx.lineWidth=(.6+ray.depth*1.2)*(1+advance*.7);
    warpCtx.beginPath();
    warpCtx.moveTo(cx+x*(radius-length),cy+y*(radius-length));
    warpCtx.lineTo(cx+x*radius,cy+y*radius);
    warpCtx.stroke();
  }
  warpCtx.restore();
}
sizeWarpCanvas();
window.addEventListener('resize',sizeWarpCanvas,{passive:true});

const impactPulse = document.querySelector('#impactPulse');
const frontPanel = document.querySelector('.front-panel');
const insideView = document.querySelector('#portfolio');

// Optical portal opening: the room is seen THROUGH a growing rectangular
// aperture. No opacity changes are involved, so there is no ghosted face.
function showAperture(progress) {
  const t = bound((progress - .805) / .155, 0, 1);
  // Starts decisively and accelerates at the end. It fills the entire screen.
  const burst = t < 1 ? Math.pow(t, 1.18) : 1;
  const inset = (50 * (1 - burst)).toFixed(3);
  insideView.style.clipPath = `inset(${inset}% ${inset}% ${inset}% ${inset}%)`;
  const visible = burst > .01 && burst < 1;
  impactPulse.style.setProperty('--pulse-w', `${Math.round(window.innerWidth * burst)}px`);
  impactPulse.style.setProperty('--pulse-h', `${Math.round(window.innerHeight * burst)}px`);
  impactPulse.style.setProperty('--pulse-opacity', visible ? `${Math.min(1, (1-burst)*4)}` : '0');
}
function cleanEntryStyles() {
  voidView.classList.remove('is-aligning','is-entering');
  cubeMotion.style.removeProperty('transform');
  frontPanel.style.removeProperty('--portal-twist');
  frontPanel.style.removeProperty('--portal-counter');
  frontPanel.style.removeProperty('--portal-expand');
  frontPanel.style.removeProperty('--blade-open');
  insideView.style.removeProperty('clip-path');
  impactPulse.style.removeProperty('--pulse-w');
  impactPulse.style.removeProperty('--pulse-h');
  impactPulse.style.removeProperty('--pulse-opacity');
  warpCtx.clearRect(0,0,warpWidth,warpHeight);
}

async function enterCube() {
  if (inside || cubeTransitioning) return;
  cubeTransitioning = true;
  stopSpin();
  cubeTrigger.blur();
  voidView.classList.add('is-aligning');
  if (reducedMotion.matches) {
    inside=true;
    body.className='state-inside';
    cleanEntryStyles();
    cubePose={pitch:-18,yaw:-32};renderCube();
    cubeTransitioning=false;
    updateDepth();updateRoomUI();drawRotation();
    stage.focus({preventScroll:true});
    return;
  }

  const originalPitch=cubePose.pitch;
  const originalYaw=cubePose.yaw;
  // Preserve whichever physical face the user spun to, then square up the
  // nearest front-facing orientation for the final portal rush.
  const nearestFront=Math.round(originalYaw/360)*360;
  const yawDistance=originalYaw-nearestFront;
  insideView.style.clipPath='inset(50% 50% 50% 50%)';
  voidView.classList.add('is-entering');
  body.className='state-crossing';
  const started=performance.now();
  await new Promise(resolve => {
    function frame(now){
      const p=bound((now-started)/ENTER_MS,0,1);
      // Fluid forward acceleration. The cube remains solid, never fades.
      const travel=Math.pow(p,1.39);
      const scale=Math.exp(Math.log(32)*travel);
      // First the cube reacts, then the front rotates to face the viewer.
      const align=smoothStep(.09,.69,p);
      const pitch=originalPitch*(1-align);
      const yaw=nearestFront+yawDistance*(1-align);
      cubeMotion.style.transform=`scale(${scale.toFixed(4)})`;
      introCube.style.transform=`rotateX(${pitch.toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg)`;

      // Mechanical panels shift and diamond geometry turns on the cube face.
      const gears=smoothStep(.21,.76,p);
      frontPanel.style.setProperty('--portal-twist',`${(gears*43).toFixed(2)}deg`);
      frontPanel.style.setProperty('--portal-counter',`${(-gears*34).toFixed(2)}deg`);
      frontPanel.style.setProperty('--portal-expand',(1+gears*.26).toFixed(3));
      frontPanel.style.setProperty('--blade-open',(gears*1.15).toFixed(3));
      drawWarp(p);
      showAperture(p);
      if(p<1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  // Hard cut: the aperture is already full frame. No dissolve, no pause.
  inside=true;
  body.className='state-inside';
  cleanEntryStyles();
  cubePose={pitch:-18,yaw:-32};
  renderCube();
  updateDepth();updateRoomUI();drawRotation();
  cubeTransitioning=false;
  stage.focus({preventScroll:true});
}

function exitCube() {
  if (!inside || cubeTransitioning) return;
  inside = false;
  cubeTransitioning = true;
  transitioning = false;
  clearTimeout(transitionTimeout);
  stopSpin();
  cubePose = {pitch:-18,yaw:-32};
  renderCube();
  body.className = 'state-exiting';
  setTimeout(() => {
    body.className = 'state-void';
    cubeTransitioning = false;
    cubeTrigger.focus({preventScroll:true});
  }, reducedMotion.matches ? 20 : EXIT_MS);
}

renderCube();
document.querySelector('#exitButton').addEventListener('click', exitCube);
document.querySelector('#homeMark').addEventListener('click', exitCube);
document.querySelector('#nextRoom').addEventListener('click', () => rotateBy(1));
document.querySelector('#prevRoom').addEventListener('click', () => rotateBy(-1));
navLinks.forEach(button => button.addEventListener('click', () => gotoRoom(Number(button.dataset.goto))));

// Pointer gestures on open areas of the page rotate the entire viewport.
// Buttons, interactive demos, and text remain normal DOM elements.
const INTERACTIVE = 'button, a, input, textarea, select, canvas, dialog, label';
stage.addEventListener('pointerdown', event => {
  if (!inside || transitioning || event.button !== 0 || event.target.closest(INTERACTIVE)) return;
  drag = { x: event.clientX, y: event.clientY, moved: false };
  try { stage.setPointerCapture(event.pointerId); } catch (_) {}
});
stage.addEventListener('pointermove', event => {
  if (!drag) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (Math.abs(dx) < 7 && !drag.moved) return;
  if (Math.abs(dy) > Math.abs(dx) * 1.4 && !drag.moved) { drag = null; return; }
  drag.moved = true;
  shell.classList.add('no-transition');
  stage.classList.add('is-dragging');
  const previewDegrees = Math.max(-60, Math.min(60, (dx / Math.max(320, stage.clientWidth)) * 96));
  drawRotation(previewDegrees);
});
function finishGesture(event, cancelled = false) {
  if (!drag) return;
  const dx = event.clientX - drag.x;
  const moved = drag.moved;
  drag = null;
  try { if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId); } catch (_) {}
  stage.classList.remove('is-dragging');
  shell.classList.remove('no-transition');
  if (!cancelled && moved && Math.abs(dx) > 48) rotateBy(dx < 0 ? 1 : -1);
  else drawRotation();
}
stage.addEventListener('pointerup', event => finishGesture(event));
stage.addEventListener('pointercancel', event => finishGesture(event, true));
stage.addEventListener('pointerleave', event => { if (drag && event.buttons === 0) finishGesture(event, true); });

// Normal scrolling is preserved within a room. At its top or bottom, wheel
// input rotates to an adjacent room, like crossing a wall of the cube.
stage.addEventListener('wheel', event => {
  if (!inside || transitioning || Math.abs(event.deltaY) < 22) return;
  if (event.target.closest('.lab-workbench')) return;
  const scroll = activeFace().querySelector('.face-scroller');
  const down = event.deltaY > 0;
  const atTop = scroll.scrollTop <= 2;
  const atBottom = scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 3;
  if ((down && !atBottom) || (!down && !atTop)) return;
  event.preventDefault();
  if (performance.now() - lastWheel < 1420) return;
  lastWheel = performance.now();
  rotateBy(down ? 1 : -1);
}, { passive: false });

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (document.querySelector('#projectDialog').open) return;
    if (inside) { event.preventDefault(); exitCube(); }
    return;
  }
  if (!inside || document.querySelector('#projectDialog').open) return;
  if (event.target.closest('input,textarea,select')) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); rotateBy(1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); rotateBy(-1); }
});
window.addEventListener('resize', () => { updateDepth(); drawRotation(); });
if ('ResizeObserver' in window) new ResizeObserver(updateDepth).observe(stage);

// Project details use a native dialog. The demo has no invented public links.
const projectDialog = document.querySelector('#projectDialog');
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = PROJECTS[button.dataset.project];
  if (!project) return;
  document.querySelector('#modalLabel').textContent = project.label;
  document.querySelector('#modalTitle').textContent = project.title;
  document.querySelector('#modalBody').textContent = project.description;
  document.querySelector('#modalTags').replaceChildren(...project.tags.map(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    return span;
  }));
  projectDialog.showModal();
}));
document.querySelector('#closeDialog').addEventListener('click', () => projectDialog.close());
document.querySelector('#modalDone').addEventListener('click', () => projectDialog.close());
projectDialog.addEventListener('click', event => { if (event.target === projectDialog) projectDialog.close(); });

const contactLink = document.querySelector('#contactLink');
if (CONFIG.email) {
  contactLink.href = `mailto:${CONFIG.email}`;
  contactLink.textContent = 'Send me an email ↗';
  contactLink.removeAttribute('aria-disabled');
  document.querySelector('.contact-secondary').textContent = CONFIG.email;
}

// An original, dependency-free Canvas experiment for the Laboratory face.
// It renders a grid of points responding to the cursor and circular ripples.
const canvas = document.querySelector('#signalCanvas');
const ctx = canvas.getContext('2d');
const energySlider = document.querySelector('#energy');
const energyValue = document.querySelector('#energyValue');
let energy = .6;
let cursor = { x: -1000, y: -1000, active: false };
let ripples = [];
let canvasW = 1, canvasH = 1;
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasW = rect.width;
  canvasH = rect.height;
  canvas.width = Math.round(canvasW * dpr);
  canvas.height = Math.round(canvasH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function pointerToCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}
canvas.addEventListener('pointermove', event => { cursor = { ...pointerToCanvas(event), active: true }; });
canvas.addEventListener('pointerleave', () => { cursor.active = false; });
canvas.addEventListener('click', event => { const pos = pointerToCanvas(event); ripples.push({ ...pos, born: performance.now() }); });
energySlider.addEventListener('input', () => { energy = Number(energySlider.value) / 100; energyValue.textContent = `${energySlider.value}%`; });
document.querySelector('#resetField').addEventListener('click', () => { ripples = []; energy = .6; energySlider.value = '60'; energyValue.textContent = '60%'; cursor.active = false; });
function renderField(time) {
  if (canvas.width > 0 && canvasH > 0 && inside && wrap(steps) === 3) {
    ctx.clearRect(0, 0, canvasW, canvasH);
    const reduced = reducedMotion.matches;
    const gap = canvasW < 480 ? 22 : 28;
    const cols = Math.floor(canvasW / gap);
    const rows = Math.floor(canvasH / gap);
    const left = (canvasW - cols * gap) / 2;
    const top = (canvasH - rows * gap) / 2;
    ripples = ripples.filter(r => time - r.born < 1900);
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        const px = left + x * gap;
        const py = top + y * gap;
        const distance = Math.hypot(cursor.x - px, cursor.y - py);
        const cursorBoost = cursor.active ? Math.max(0, 1 - distance / 160) : 0;
        let rippleBoost = 0;
        for (const ripple of ripples) {
          const age = (time - ripple.born) / 1000;
          const ring = Math.abs(Math.hypot(px - ripple.x, py - ripple.y) - age * 200);
          rippleBoost += Math.max(0, 1 - ring / 45) * Math.max(0, 1 - age / 1.9);
        }
        const wave = reduced ? 0 : (.5 + .5 * Math.sin(x * .51 + y * .35 - time * .0011));
        const intensity = Math.min(1, .13 + wave * .20 * energy + cursorBoost * .65 * energy + rippleBoost * .8 * energy);
        ctx.fillStyle = `rgba(156,226,188,${Math.min(.92, intensity)})`;
        const radius = 1.1 + intensity * 2.6;
        ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  if (!reducedMotion.matches) requestAnimationFrame(renderField);
}
if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(canvas);
else window.addEventListener('resize', resizeCanvas);
resizeCanvas();
if (reducedMotion.matches) { renderField(0); reducedMotion.addEventListener('change', () => { if (!reducedMotion.matches) requestAnimationFrame(renderField); }); }
else requestAnimationFrame(renderField);

// Support the skip link even before the user enters the cube.
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  enterCube();
});
updateDepth();
updateRoomUI();
drawRotation();

