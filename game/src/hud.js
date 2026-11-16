export function createHud() {
  const overlay = document.getElementById('overlay');
  const title = document.getElementById('overlay-title');
  const copy = document.getElementById('overlay-copy');
  const play = document.getElementById('play');
  const ammo = document.getElementById('ammo');
  const ammoMag = document.getElementById('ammo-mag');
  const ammoReserve = document.getElementById('ammo-reserve');
  const scoreValue = document.getElementById('score-value');
  const hitmarker = document.getElementById('hitmarker');
  const buyMenu = document.getElementById('buy-menu');
  const scoreboard = document.getElementById('scoreboard');
  const healthEl = document.getElementById('health-value');
  const armorEl = document.getElementById('armor-value');
  const moneyEl = document.getElementById('money-value');
  const timerEl = document.getElementById('timer-value');
  const roundEl = document.getElementById('round-value');
  const statusEl = document.getElementById('status-value');
  const plantBar = document.getElementById('plant-bar');
  const plantFill = document.getElementById('plant-fill');

  let hitTimer = 0;
  let lastMag = -1;
  let lastReserve = -1;
  let lastScore = -1;

  return {
    setAmmo(mag, reserve) {
      if (mag === lastMag && reserve === lastReserve) return;
      lastMag = mag;
      lastReserve = reserve;
      ammoMag.textContent = String(mag);
      ammoReserve.textContent = `/ ${reserve}`;
      ammo.classList.toggle('empty', mag === 0);
    },
    setScore(value) {
      if (value === lastScore) return;
      lastScore = value;
      scoreValue.textContent = String(value);
    },
    setStatus(health, armor, money, timer, round, phase) {
      if (healthEl) healthEl.textContent = String(health);
      if (armorEl) armorEl.textContent = String(armor);
      if (moneyEl) moneyEl.textContent = `$${money}`;
      if (timerEl) {
        const mins = Math.floor(timer / 60);
        const secs = Math.floor(timer % 60);
        timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }
      if (roundEl) roundEl.textContent = String(round);
      if (statusEl) statusEl.textContent = phase.toUpperCase();
    },
    setPlantProgress(progress, max) {
      if (!plantBar || !plantFill) return;
      if (progress > 0) {
        plantBar.hidden = false;
        plantFill.style.width = `${Math.min(100, (progress / max) * 100)}%`;
      } else {
        plantBar.hidden = true;
      }
    },
    hitMarker(killed, holdMs = 90) {
      hitmarker.classList.add('on');
      hitmarker.style.transform = killed ? 'translate(-50%, -50%) rotate(45deg) scale(1.25)' : '';
      clearTimeout(hitTimer);
      hitTimer = setTimeout(() => {
        hitmarker.classList.remove('on');
        hitmarker.style.transform = '';
      }, holdMs);
    },
    showOverlay(mode, score) {
      const titles = {
        start: 'BREACH PROTOCOL',
        paused: 'GAME PAUSED',
        end: 'ROUND END',
      };
      const copies = {
        start: 'Round-based tactical FPS. Click to deploy.',
        paused: 'Paused. Click to resume.',
        end: `Round complete. Score: ${score}`,
      };
      title.textContent = titles[mode] || 'BREACH PROTOCOL';
      copy.textContent = copies[mode] || '';
      play.textContent = mode === 'paused' ? 'Resume' : 'Deploy';
      overlay.hidden = false;
      play.focus();
    },
    hideOverlay() {
      overlay.hidden = true;
    },
    toggleBuyMenu(show) {
      if (buyMenu) buyMenu.hidden = !show;
    },
    toggleScoreboard(show) {
      if (scoreboard) scoreboard.hidden = !show;
    },
    onPlay(handler) {
      play.addEventListener('click', handler);
    },
  };
}
