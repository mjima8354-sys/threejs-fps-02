export function createRoundManager() {
  const state = {
    phase: 'buy', // 'buy', 'live', 'planted', 'ended'
    roundNumber: 1,
    teamScore: 0,
    enemyScore: 0,
    timer: 15, // buy phase timer
    liveTimer: 105, // round live timer (1m 45s)
    bombPlanted: false,
    bombTimer: 40,
    planting: false,
    plantProgress: 0,
    defusing: false,
    defuseProgress: 0,
    bombSite: null,
    winner: null,
  };

  const BUY_DURATION = 15;
  const LIVE_DURATION = 105;
  const BOMB_DURATION = 40;
  const PLANT_TIME = 3.0;
  const DEFUSE_TIME = 5.0;

  function startBuyPhase() {
    state.phase = 'buy';
    state.timer = BUY_DURATION;
    state.bombPlanted = false;
    state.planting = false;
    state.plantProgress = 0;
    state.defusing = false;
    state.defuseProgress = 0;
    state.bombSite = null;
    state.winner = null;
  }

  function startLivePhase() {
    state.phase = 'live';
    state.timer = LIVE_DURATION;
  }

  function step(dt, player, bots, sites) {
    if (state.phase === 'buy') {
      state.timer -= dt;
      if (state.timer <= 0) {
        startLivePhase();
      }
    } else if (state.phase === 'live') {
      state.timer -= dt;
      if (state.timer <= 0) {
        // Time expired -> Defenders win
        endRound('defenders', 'Time expired');
      }
    } else if (state.phase === 'planted') {
      state.bombTimer -= dt;
      state.timer -= dt;
      if (state.bombTimer <= 0) {
        // Bomb detonated -> Attackers win
        endRound('attackers', 'Bomb detonated');
      }
    }

    // Check elimination
    if (state.phase !== 'buy' && state.phase !== 'ended') {
      if (bots.remaining() === 0) {
        endRound('attackers', 'All defenders eliminated');
      } else if (player.health <= 0) {
        endRound('defenders', 'Operator eliminated');
      }
    }
  }

  function startPlanting(playerPos, sites) {
    if (state.phase !== 'live' || state.bombPlanted) return false;
    for (const site of sites) {
      if (playerPos.distanceTo(site.center) <= site.radius) {
        state.planting = true;
        state.bombSite = site;
        return true;
      }
    }
    return false;
  }

  function updatePlanting(dt, playerPos, sites) {
    if (!state.planting) return false;
    const site = state.bombSite;
    if (!site || playerPos.distanceTo(site.center) > site.radius) {
      state.planting = false;
      state.plantProgress = 0;
      return false;
    }
    state.plantProgress += dt;
    if (state.plantProgress >= PLANT_TIME) {
      state.planting = false;
      state.bombPlanted = true;
      state.phase = 'planted';
      state.bombTimer = BOMB_DURATION;
      return true;
    }
    return false;
  }

  function cancelPlanting() {
    state.planting = false;
    state.plantProgress = 0;
  }

  function endRound(winnerTeam, reason) {
    state.phase = 'ended';
    state.winner = winnerTeam;
    if (winnerTeam === 'attackers') {
      state.teamScore += 1;
    } else {
      state.enemyScore += 1;
    }
  }

  return {
    state,
    step,
    startBuyPhase,
    startLivePhase,
    startPlanting,
    updatePlanting,
    cancelPlanting,
    endRound,
    PLANT_TIME,
    DEFUSE_TIME,
  };
}
