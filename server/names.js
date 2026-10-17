// Nomi leggibili per le pagine pubbliche. Duplicano i dati del client: si unificheranno quando
// le regole di gioco passeranno al server (vedi ARCHITETTURA.md).
module.exports = {
  CLASS: { guard: 'Guardiano', ombra: 'Ombra', spad: 'Spadaccino', arc: 'Arciere', bardo: 'Bardo', tempo: 'Mago del tempo', sac: 'Sacerdote', drui: 'Druido' },
  RACE: { umano: 'Umani del Vespro', kharun: 'Kharun' },
  CRAFT: { smith: 'Fabbro', weave: 'Tessitore', wood: 'Carpentiere', alch: 'Alchimista' },
  SLOT: { w: 'Arma', a: 'Armatura', h: 'Elmo' },
  QUALITY: ['Normale', 'Fine', 'Eccellente'],
  ITEM: { w0: 'Arma logora', w1: 'Arma temprata', w2: 'Arma del Vespro', w3: 'Arma della Fiamma Nera',
    a0: 'Casacca da viaggio', a1: 'Maglia di ferro', a2: 'Corazza del Vespro', a3: 'Veste del Custode', a4: 'Veste di lino', a5: 'Tunica del Vespro',
    h0: 'Nessun elmo', h1: 'Elmo di pelle di lupo', h2: 'Cappuccio del brigante', h3: 'Elmo d’acciaio', h4: 'Cappuccio del Seguace', h5: 'Cappello del tessitore' },
  RARITY: { w0: 0, w1: 1, w2: 3, w3: 3, a0: 0, a1: 1, a2: 3, a3: 2, a4: 1, a5: 3, h0: 0, h1: 0, h2: 1, h3: 2, h4: 2, h5: 2 },
  RARITY_NAME: ['Comune', 'Non comune', 'Raro', 'Epico', 'Leggendario'],
  RARITY_COLOR: ['#9a9a9a', '#4fb06d', '#4a90d9', '#a05ad6', '#d9a93a'],
};
