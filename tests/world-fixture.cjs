const base = require('./character-fixture.cjs');
const World = require('../world-system.js');
const Quests = require('../quest-system.js');
module.exports = options => {
  const f = base(options);
  const dependencies = { store: f.store, progression: f.system, classes: f.classes,
    now: () => f.clock.value, random: () => 0.42, testMode: !!options?.testMode };
  f.world = World.create(dependencies);
  f.quests = Quests.create(dependencies);
  f.fight = async (enemyId, seed = 7) => {
    const start = await f.world.startEncounter(enemyId, {seed});
    if (!start.ok) throw new Error(start.message);
    return f.world.finishEncounter(start.ticket.id);
  };
  return f;
};
