const paddocks = [...document.querySelectorAll('.paddock')];
const herds = paddocks.map(() => []);

function makeCow(index) {
  const cow = document.createElement('img');
  cow.className = 'cow';
  cow.setAttribute('aria-hidden', 'true');
  cow.src = 'cow1.png';
  cow.alt = '';
  cow.draggable = false;
  cow.dataset.id = index;
  return cow;
}

function wanderCow(cow, paddock, initial = false) {
  const margin = 30;
  const maxX = Math.max(margin, paddock.clientWidth - margin);
  const maxY = Math.max(margin, paddock.clientHeight - margin);

  if (initial) {
    cow.style.left = `${margin + Math.random() * Math.max(0, maxX - margin)}px`;
    cow.style.top = `${margin + Math.random() * Math.max(0, maxY - margin)}px`;
    cow.style.transition = 'none';
    requestAnimationFrame(() => {
      cow.style.transition = '';
      wanderCow(cow, paddock);
    });
    return;
  }

  const currentX = parseFloat(cow.style.left) || paddock.clientWidth / 2;
  const currentY = parseFloat(cow.style.top) || paddock.clientHeight / 2;
  const angle = Math.random() * Math.PI * 2;
  const distance = 24 + Math.random() * 32;
  const x = Math.max(margin, Math.min(maxX, currentX + Math.cos(angle) * distance));
  const y = Math.max(margin, Math.min(maxY, currentY + Math.sin(angle) * distance));
  cow.style.left = `${x}px`;
  cow.style.top = `${y}px`;
  // cow1.png faces left by default; flip it only when walking right.
  cow.style.setProperty('--direction', x < currentX ? 1 : -1);

  const duration = 3 + Math.random() * 2;
  cow.style.transitionDuration = `${duration}s`;
  clearTimeout(cow.wanderTimer);
  cow.wanderTimer = setTimeout(() => wanderCow(cow, paddock), duration * 1000);
}

function outerEdges(place) {
  return [
    ['top', 'left'],
    ['top', 'right'],
    ['bottom', 'left'],
    ['bottom', 'right'],
  ][place];
}

function enterPasture(paddock, place) {
  const cow = makeCow(herds.flat().length);
  const edge = outerEdges(place)[Math.floor(Math.random() * 2)];
  const x = 30 + Math.random() * Math.max(0, paddock.clientWidth - 60);
  const y = 30 + Math.random() * Math.max(0, paddock.clientHeight - 60);
  cow.style.left = `${edge === 'left' ? -35 : edge === 'right' ? paddock.clientWidth + 35 : x}px`;
  cow.style.top = `${edge === 'top' ? -35 : edge === 'bottom' ? paddock.clientHeight + 35 : y}px`;
  cow.style.transition = 'none';
  paddock.append(cow);
  requestAnimationFrame(() => {
    cow.style.transition = '';
    const fromX = parseFloat(cow.style.left);
    const targetX = 30 + Math.random() * Math.max(0, paddock.clientWidth - 60);
    const targetY = 30 + Math.random() * Math.max(0, paddock.clientHeight - 60);
    cow.style.setProperty('--direction', targetX < fromX ? 1 : -1);
    cow.style.transitionDuration = '8s';
    cow.style.left = `${targetX}px`;
    cow.style.top = `${targetY}px`;
    cow.wanderTimer = setTimeout(() => wanderCow(cow, paddock), 8000);
  });
  return cow;
}

function leavePasture(cow, paddock, place) {
  clearTimeout(cow.wanderTimer);
  cow.classList.add('leaving');
  const x = parseFloat(cow.style.left) || paddock.clientWidth / 2;
  const y = parseFloat(cow.style.top) || paddock.clientHeight / 2;
  const edge = outerEdges(place)[Math.floor(Math.random() * 2)];
  const margin = 30;
  cow.style.transitionDuration = '4s';
  if (edge === 'left' || edge === 'right') {
    cow.style.setProperty('--direction', edge === 'left' ? 1 : -1);
  } else {
    cow.style.setProperty('--direction', x < paddock.clientWidth / 2 ? 1 : -1);
  }
  cow.style.left = `${edge === 'left' ? -40 : edge === 'right' ? paddock.clientWidth + 40 : Math.max(margin, Math.min(paddock.clientWidth - margin, x))}px`;
  cow.style.top = `${edge === 'top' ? -40 : edge === 'bottom' ? paddock.clientHeight + 40 : Math.max(margin, Math.min(paddock.clientHeight - margin, y))}px`;
  setTimeout(() => cow.remove(), 4100);
}

function transferCow(cow, targetPaddock) {
  const start = cow.getBoundingClientRect();
  const margin = 30;
  const targetX = margin + Math.random() * Math.max(0, targetPaddock.clientWidth - margin * 2);
  const targetY = margin + Math.random() * Math.max(0, targetPaddock.clientHeight - margin * 2);
  const targetRect = targetPaddock.getBoundingClientRect();
  const endX = targetRect.left + targetX;
  const endY = targetRect.top + targetY;

  clearTimeout(cow.wanderTimer);
  cow.classList.add('transferring');
  cow.style.left = `${start.left + start.width / 2}px`;
  cow.style.top = `${start.top + start.height / 2}px`;
  cow.style.setProperty('--direction', endX < start.left + start.width / 2 ? 1 : -1);
  cow.style.transition = 'none';
  document.body.append(cow);
  requestAnimationFrame(() => {
    cow.style.transition = 'left 3s linear, top 3s linear';
    cow.style.left = `${endX}px`;
    cow.style.top = `${endY}px`;
  });

  setTimeout(() => {
    cow.classList.remove('transferring');
    cow.style.transition = '';
    cow.style.left = `${targetX}px`;
    cow.style.top = `${targetY}px`;
    targetPaddock.append(cow);
    wanderCow(cow, targetPaddock);
  }, 3050);
}

function syncHerds() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const digits = `${hour}${minute}`;

  const counts = [...digits].map(Number);
  const sources = [];
  const destinations = [];

  paddocks.forEach((paddock, place) => {
    const count = counts[place];
    paddock.setAttribute('aria-label', `${['時の十の位', '時の一の位', '分の十の位', '分の一の位'][place]}：牛が${count}頭`);
    if (herds[place].length > count) sources.push({ place, amount: herds[place].length - count });
    if (herds[place].length < count) destinations.push({ place, amount: count - herds[place].length });
  });

  for (const source of sources) {
    while (source.amount > 0) {
      const cow = herds[source.place].pop();
      let destination = destinations.find(item => item.amount > 0);
      if (destination) {
        destination.amount--;
        herds[destination.place].push(cow);
        transferCow(cow, paddocks[destination.place]);
      } else {
        leavePasture(cow, paddocks[source.place], source.place);
      }
      source.amount--;
    }
  }

  for (const destination of destinations) {
    while (destination.amount > 0) {
      herds[destination.place].push(enterPasture(paddocks[destination.place], destination.place));
      destination.amount--;
    }
  }
}

syncHerds();
window.addEventListener('resize', () => herds.forEach((herd, place) => herd.forEach(cow => {
  if (cow.classList.contains('transferring')) return;
  const paddock = paddocks[place];
  const margin = 30;
  cow.style.left = `${Math.max(margin, Math.min(paddock.clientWidth - margin, parseFloat(cow.style.left) || margin))}px`;
  cow.style.top = `${Math.max(margin, Math.min(paddock.clientHeight - margin, parseFloat(cow.style.top) || margin))}px`;
})));
setInterval(syncHerds, 1000);
setInterval(() => {
  document.querySelectorAll('.cow').forEach(cow => {
    cow.src = cow.src.endsWith('/cow1.png') ? 'cow2.png' : 'cow1.png';
  });
}, 1000);
