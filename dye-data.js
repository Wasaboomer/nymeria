/* M7.4 dye catalogue. Cosmetic state only: never modifies item stats. */
const DyeData = (() => {
  const schemaVersion = 1;
  const pigments = [
    { id:"vesper-teal", name:"Vesper Teal", color:"#3b7478" },
    { id:"ember-wine", name:"Ember Wine", color:"#854655" },
    { id:"sun-ochre", name:"Sun Ochre", color:"#ae884e" },
    { id:"mist-grey", name:"Mist Grey", color:"#7d8592" },
  ];
  const channels = [
    { id:"primary", name:"Primary" },
    { id:"secondary", name:"Secondary" },
    { id:"detail", name:"Detail" },
  ];
  const recipes = [
    { id:"vesper-teal-dye", pigment:"vesper-teal", profession:"herbalism", level:1, costs:{"wild-herbs":2}, amount:1 },
    { id:"ember-wine-dye", pigment:"ember-wine", profession:"herbalism", level:2, costs:{"wild-herbs":3}, amount:1 },
  ];
  const pigment=id=>pigments.find(x=>x.id===id)||null;
  const recipe=id=>recipes.find(x=>x.id===id)||null;
  const api={schemaVersion,pigments,channels,recipes,pigment,recipe};
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  return api;
})();
