/* Pure fixed-step simulation: no DOM, localStorage, animation frames or timers. */
const CombatEngine = (() => {
  const data =
    typeof module !== "undefined" && module.exports
      ? require("./combat-data.js")
      : CombatData;
  const epsilon = 1e-8;
  function seededRng(seed) {
    let value = Number(seed) >>> 0;
    return () => {
      value = (value + 0x6d2b79f5) >>> 0;
      let t = Math.imul(value ^ (value >>> 15), 1 | value);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  class Encounter {
    constructor({
      stats,
      effects = [],
      rules = data.defaultRules,
      seed,
      playerName = "Iria",
      enemyId = "guardian",
    }) {
      this.random = seededRng(
        seed === undefined ? Math.floor(Math.random() * 4294967296) : seed,
      );
      this.rules = data.normalizeRules(rules);
      this.player = {
        id: "player",
        name: playerName,
        stats: { ...stats },
        maxHp: data.formulas.maxHp(stats),
        effects: [],
        cooldowns: {},
        nextActionAt: 0,
        lastAbility: null,
      };
      this.player.hp = this.player.maxHp;
      const template = data.enemies[enemyId];
      this.enemy = {
        ...data.copy(template),
        hp: template.maxHp,
        effects: [],
        cooldowns: {},
        nextActionAt: 1.2,
        lastAbility: null,
      };
      for (const attack of this.enemy.attacks)
        this.enemy.cooldowns[attack.id] = attack.initialDelay;
      this.itemEffects = data.copy(effects);
      this.status = "idle";
      this.time = 0;
      this.ticks = 0;
      this.accumulator = 0;
      this.log = [];
      this.logVersion = 0;
      this.metrics = {
        damage: 0,
        damageTaken: 0,
        criticals: 0,
        dodges: 0,
        uses: {},
        itemProcs: 0,
      };
      this.result = null;
    }
    start() {
      if (this.status === "idle") this.status = "running";
    }
    pause() {
      if (this.status === "running") this.status = "paused";
    }
    resume() {
      if (this.status === "paused") this.status = "running";
    }
    setRules(rules) {
      this.rules = data.normalizeRules(rules);
    }
    emit(event) {
      this.logVersion++;
      this.log.push({ ...event, time: this.time, serial: this.logVersion });
      if (this.log.length > data.logLimit) this.log.shift();
    }
    effectiveStats(actor) {
      const stats = { ...actor.stats },
        modifiers = { dodge: 0 };
      for (const effect of actor.effects)
        for (const [key, value] of Object.entries(effect.modifiers || {})) {
          if (key in stats) stats[key] += value * effect.stacks;
          else modifiers[key] = (modifiers[key] || 0) + value * effect.stacks;
        }
      return { stats, modifiers };
    }
    hasEffect(actor, id) {
      return actor.effects.some(
        (e) => e.id === id && e.expiresAt > this.time + epsilon,
      );
    }
    ready(id) {
      return (this.player.cooldowns[id] || 0) <= this.time + epsilon;
    }
    conditionMet(condition, abilityId) {
      switch (condition.type) {
        case "debuffAbsent":
          return !this.hasEffect(this.enemy, condition.effectId);
        case "buffAbsent":
          return !this.hasEffect(this.player, condition.effectId);
        case "enemyHpBelow":
          return (this.enemy.hp / this.enemy.maxHp) * 100 < condition.threshold;
        case "playerHpBelow":
          return (
            (this.player.hp / this.player.maxHp) * 100 < condition.threshold
          );
        case "ready":
          return this.ready(abilityId);
        default:
          return true;
      }
    }
    chooseAbility() {
      for (const rule of this.rules)
        if (
          this.ready(rule.abilityId) &&
          this.conditionMet(rule.condition, rule.abilityId)
        )
          return data.abilities.find((a) => a.id === rule.abilityId);
      return null;
    }
    applyEffect(target, id, origin, options = {}) {
      const template = data.effects[id];
      if (!template) return;
      const duration = template.duration + (options.extraDuration || 0);
      const sourceStats = this.effectiveStats(this.player).stats;
      const tickDamage = template.damageCoefficient
        ? data.formulas.damage(sourceStats) *
          template.damageCoefficient *
          (options.tickMultiplier || 1)
        : 0;
      const current = target.effects.find(
        (e) => e.id === id && e.origin.actorId === origin.actorId,
      );
      if (current) {
        current.stacks = Math.min(template.maxStacks, current.stacks + 1);
        current.expiresAt = Math.max(current.expiresAt, this.time + duration);
        current.tickDamage = Math.max(current.tickDamage, tickDamage);
        current.origin = { ...origin };
        // Refresh preserves nextTickAt so frequent refreshes cannot suppress ticks.
        this.emit({
          type: "effectRefresh",
          effectId: id,
          targetId: target.id,
          origin: { ...origin },
        });
      } else {
        target.effects.push({
          ...data.copy(template),
          stacks: 1,
          expiresAt: this.time + duration,
          nextTickAt: template.tickInterval
            ? this.time + template.tickInterval
            : null,
          tickDamage,
          origin: { ...origin },
        });
        this.emit({
          type: "effectApply",
          effectId: id,
          targetId: target.id,
          origin: { ...origin },
        });
      }
    }
    damage(target, amount, event) {
      const dealt = Math.min(target.hp, Math.max(1, Math.round(amount)));
      target.hp = Math.max(0, target.hp - dealt);
      if (target === this.enemy) this.metrics.damage += dealt;
      else this.metrics.damageTaken += dealt;
      this.emit({ ...event, damage: dealt, targetId: target.id });
    }
    tickEffects(actor) {
      for (const effect of actor.effects) {
        while (
          effect.nextTickAt !== null &&
          effect.nextTickAt <= this.time + epsilon &&
          effect.nextTickAt <= effect.expiresAt + epsilon &&
          actor.hp > 0
        ) {
          this.damage(
            actor,
            data.formulas.mitigated(
              effect.tickDamage * effect.stacks,
              actor === this.enemy
                ? actor.armor
                : this.effectiveStats(actor).stats.armor,
            ),
            {
              type: "dot",
              actorId: effect.origin.actorId,
              effectId: effect.id,
              origin: { ...effect.origin },
            },
          );
          effect.nextTickAt += effect.tickInterval;
        }
      }
      actor.effects = actor.effects.filter((effect) => {
        if (effect.expiresAt > this.time + epsilon) return true;
        this.emit({
          type: "effectExpire",
          effectId: effect.id,
          targetId: actor.id,
        });
        return false;
      });
    }
    playerAction(ability) {
      const stats = this.effectiveStats(this.player).stats;
      this.player.lastAbility = ability.id;
      this.player.cooldowns[ability.id] = this.time + ability.cooldown;
      this.metrics.uses[ability.id] = (this.metrics.uses[ability.id] || 0) + 1;
      if (ability.kind === "buff")
        this.applyEffect(this.player, ability.effectId, {
          actorId: "player",
          abilityId: ability.id,
        });
      else {
        let raw =
          data.formulas.damage(stats) * ability.coefficient +
          ability.flatDamage;
        if (
          ability.executeBelow &&
          this.enemy.hp / this.enemy.maxHp < ability.executeBelow
        )
          raw *= ability.executeMultiplier;
        const critical = this.random() < data.formulas.criticalChance(stats);
        if (critical) {
          raw *= data.formulas.criticalMultiplier;
          this.metrics.criticals++;
        }
        this.damage(
          this.enemy,
          data.formulas.mitigated(raw, this.enemy.armor),
          {
            type: "playerAction",
            actorId: "player",
            abilityId: ability.id,
            critical,
          },
        );
        if (this.enemy.hp > 0) {
          if (ability.effectId)
            this.applyEffect(this.enemy, ability.effectId, {
              actorId: "player",
              abilityId: ability.id,
            });
          for (const effect of this.itemEffects) {
            const hook = data.itemHooks[effect.id];
            if (
              hook &&
              ability.tags.includes(hook.trigger) &&
              this.random() < hook.chance
            ) {
              this.metrics.itemProcs++;
              this.emit({
                type: "itemProc",
                itemId: effect.itemId,
                effectId: effect.id,
                actorId: "player",
              });
              this.applyEffect(
                this.enemy,
                hook.effectId,
                {
                  actorId: "player",
                  abilityId: ability.id,
                  itemId: effect.itemId,
                },
                hook,
              );
            }
          }
        }
      }
      // Buffs can alter this same action's GCD, but never reset ability cooldowns.
      this.player.nextActionAt =
        this.time + data.formulas.gcd(this.effectiveStats(this.player).stats);
    }
    enemyAction() {
      const attack = this.enemy.attacks.find(
        (a) => (this.enemy.cooldowns[a.id] || 0) <= this.time + epsilon,
      );
      if (!attack) return;
      this.enemy.lastAbility = attack.id;
      this.enemy.cooldowns[attack.id] = this.time + attack.cooldown;
      const effective = this.effectiveStats(this.player);
      if (
        this.random() <
        data.formulas.dodgeChance(effective.stats, effective.modifiers.dodge)
      ) {
        this.metrics.dodges++;
        this.emit({
          type: "dodge",
          actorId: "enemy",
          abilityId: attack.id,
          targetId: "player",
        });
      } else
        this.damage(
          this.player,
          data.formulas.mitigated(attack.damage, effective.stats.armor),
          { type: "enemyAction", actorId: "enemy", abilityId: attack.id },
        );
      this.enemy.nextActionAt = this.time + this.enemy.attackInterval;
    }
    finishIfDead() {
      if (this.enemy.hp > 0 && this.player.hp > 0) return false;
      this.status = "finished";
      const mostUsed = Object.entries(this.metrics.uses).sort(
        (a, b) => b[1] - a[1],
      )[0];
      this.result = {
        outcome: this.enemy.hp <= 0 ? "victory" : "defeat",
        duration: this.time,
        ...data.copy(this.metrics),
        dps: this.time > 0 ? this.metrics.damage / this.time : 0,
        mostUsed: mostUsed
          ? { abilityId: mostUsed[0], count: mostUsed[1] }
          : null,
      };
      this.emit({ type: "result", outcome: this.result.outcome });
      return true;
    }
    step() {
      this.ticks++;
      this.time = this.ticks * data.step;
      this.tickEffects(this.player);
      this.tickEffects(this.enemy);
      if (this.finishIfDead()) return;
      if (this.player.nextActionAt <= this.time + epsilon) {
        const ability = this.chooseAbility();
        if (ability) this.playerAction(ability);
      }
      if (this.finishIfDead()) return;
      if (this.enemy.nextActionAt <= this.time + epsilon) this.enemyAction();
      this.finishIfDead();
    }
    advance(seconds) {
      if (
        this.status !== "running" ||
        !Number.isFinite(seconds) ||
        seconds <= 0
      )
        return;
      this.accumulator += seconds;
      while (
        this.accumulator + epsilon >= data.step &&
        this.status === "running"
      ) {
        this.accumulator = Math.max(0, this.accumulator - data.step);
        this.step();
      }
    }
    snapshot() {
      return data.copy({
        status: this.status,
        time: this.time,
        player: this.player,
        enemy: this.enemy,
        metrics: this.metrics,
        log: this.log,
        logVersion: this.logVersion,
        result: this.result,
      });
    }
  }
  return { create: (options) => new Encounter(options), seededRng };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = CombatEngine;
