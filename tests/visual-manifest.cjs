const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const art = require("../visual-manifest.js"),
  fixture = require("./character-fixture.cjs");
let checks = 0;
const check = (name, fn) => {
  fn();
  checks++;
  console.log("PASS " + name);
};
check(
  "all independent assets share canvas and declared rig, layers, z-order, metadata and real files",
  () => {
    for (const asset of Object.values(art.assets)) {
      assert.equal(asset.compatibleRig, art.rig.id);
      assert.equal(asset.zOrder, art.layers.indexOf(asset.layer));
      assert.ok(Array.isArray(asset.hideRules));
      assert.ok(Array.isArray(asset.classCompatibility));
      assert.ok(Array.isArray(asset.equipmentItems));
      const source = fs.readFileSync(
        path.join(__dirname, "..", asset.file),
        "utf8",
      );
      assert.match(source, /viewBox="0 0 360 640"/);
      assert.doesNotMatch(source, /<image|<script|https?:\/\/(?!www.w3.org)/);
    }
  },
);
check(
  "Plate A/B have truly distinct geometry for every armor piece, sword and shield",
  () => {
    for (const part of [
      "torso",
      "legs",
      "boots",
      "gloves",
      "shoulders",
      "helmet",
    ])
      assert.notEqual(
        fs.readFileSync(
          path.join(__dirname, "../assets/character/plate-a-" + part + ".svg"),
          "utf8",
        ),
        fs.readFileSync(
          path.join(__dirname, "../assets/character/plate-b-" + part + ".svg"),
          "utf8",
        ),
      );
    for (const part of ["sword", "shield"])
      assert.notEqual(
        fs.readFileSync(
          path.join(__dirname, "../assets/character/" + part + "-a.svg"),
          "utf8",
        ),
        fs.readFileSync(
          path.join(__dirname, "../assets/character/" + part + "-b.svg"),
          "utf8",
        ),
      );
  },
);
check(
  "all item mappings exist in actual inventory; seven art alternatives retain exactly the original stats/proficiency/level",
  () => {
    const f = fixture(),
      items = f.read("Equipment.state.inventory");
    assert.equal(items.length, 56);
    for (const id of Object.keys(art.itemVisuals))
      assert.ok(
        items.some((i) => i.id === id),
        id,
      );
    for (const [old, id] of [
      ["torso-warden", "torso-vesper"],
      ["legs-sentinel", "legs-vesper"],
      ["boots-plate", "boots-vesper"],
      ["gloves-iron", "gloves-vesper"],
      ["head-helm", "head-vesper"],
      ["sword", "vesper-sword"],
      ["shield", "vesper-shield"],
    ]) {
      const a = items.find((i) => i.id === old),
        b = items.find((i) => i.id === id);
      assert.deepEqual(b.stats, a.stats);
      assert.equal(b.armorType, a.armorType);
      assert.equal(b.requiredLevel, a.requiredLevel);
    }
  },
);
check("data-driven closed/open helmet and actual two-handed rules", () => {
  const f = fixture(),
    items = f.read("Equipment.state.inventory"),
    model = {
      character: { hair: "braid", face: "scar" },
      items: {
        head: items.find((i) => i.id === "head-vesper"),
        support: items.find((i) => i.id === "shield"),
      },
      twoHanded: false,
    };
  let view = art.resolve(model);
  assert.equal(view.head, "plate-b-helmet");
  assert.equal(view["hair-front"], undefined);
  assert.equal(view.face, undefined);
  assert.equal(view.support, "shield-a");
  model.items.head = items.find((i) => i.id === "head-helm");
  view = art.resolve(model);
  assert.equal(view["hair-front"], "hair-braid-front");
  model.twoHanded = true;
  assert.equal(art.resolve(model).support, undefined);
});
check(
  "additive legacy migration preserves created appearance/resources, adds safe defaults and visual alternatives once",
  () => {
    const f = fixture();
    f.equipment.setCharacter("hair", "crest");
    f.equipment.createCharacter();
    const memory = f.memory,
      raw = JSON.parse(memory.get(f.equipment.SAVE_KEY));
    delete raw.character.skin;
    delete raw.character.face;
    raw.inventory = raw.inventory.filter((i) => !i.id.includes("vesper"));
    memory.set(f.equipment.SAVE_KEY, JSON.stringify(raw));
    const reload = fixture({ memory });
    assert.equal(reload.equipment.state.characterCreated, true);
    assert.equal(reload.equipment.creatorAvailable, false);
    assert.equal(reload.equipment.state.character.hair, "crest");
    assert.equal(reload.equipment.state.character.skin, "warm");
    assert.equal(reload.equipment.state.character.face, "calm");
    assert.equal(reload.equipment.state.inventory.length, 56);
    reload.equipment.save();
    assert.equal(fixture({ memory }).equipment.state.inventory.length, 56);
  },
);
check(
  "three actual hair styles, skin tones, eye/hair colors and two face options are accepted only in Creator",
  () => {
    const f = fixture();
    for (const key of ["skin", "hair", "hairColor", "eyes"])
      assert.equal(f.equipment.appearanceAllowed[key].length, 3);
    assert.equal(f.equipment.appearanceAllowed.face.length, 2);
    for (const [key, values] of Object.entries(f.equipment.appearanceAllowed))
      for (const value of values)
        assert.equal(f.equipment.setCharacter(key, value), true);
    f.equipment.createCharacter();
    assert.equal(f.equipment.setCharacter("skin", "warm"), false);
  },
);
check(
  "asset weight budget and map/enemy assets are locally supplied, no bitmap combinations",
  () => {
    const files = fs.readdirSync(path.join(__dirname, "../assets/character"));
    const total = files.reduce(
      (sum, file) =>
        sum +
        fs.statSync(path.join(__dirname, "../assets/character", file)).size,
      0,
    );
    assert.ok(total < 150000, total);
    for (const file of files)
      assert.ok(
        fs.statSync(path.join(__dirname, "../assets/character", file)).size <
          8000,
      );
    for (const file of Object.values(art.enemies))
      assert.ok(
        fs.existsSync(
          path.join(__dirname, "../assets/enemies/" + file + ".svg"),
        ),
      );
    assert.equal(Object.keys(art.mapNodes).length, 6);
  },
);
console.log(checks + " visual pipeline/data checks passed.");
