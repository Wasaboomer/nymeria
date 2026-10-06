# Nymeria Modular Character Prototype 0.1

Vertical slice mobile-first, senza framework, pacchetti o servizi esterni. Pubblicabile direttamente con GitHub Pages dalla radice del repository.

## Avvio locale

Dalla directory del repository:

```sh
python3 -m http.server 8000
```

Aprire la pagina servita sulla porta 8000. Usare HTTP per un comportamento coerente di localStorage. Il pulsante **Salva aspetto** conserva la configurazione su questo browser e origine; **Casuale** non sovrascrive il salvataggio finché non viene premuto Salva.

## Struttura

- `index.html`: interfaccia, definizioni dei materiali SVG e rig.
- `styles.css`: layout responsive, materiali UI e idle; rispetta `prefers-reduced-motion`.
- `items.js`: catalogo degli oggetti e delle palette, geometrie indipendenti e ordine dei layer.
- `app.js`: stato validato, persistenza, rendering per slot, statistiche e UI.

Ogni gruppo SVG del rig resta nello stesso sistema di coordinate (300 × 440). Equipaggiare un oggetto sostituisce soltanto i figli del gruppo relativo; capelli anteriori e posteriori costituiscono una coppia. I colori capelli e occhi usano canali dedicati. `--dye` è definito esclusivamente sul gruppo della corazza e usato soltanto dai suoi inserti. Nessun filtro, maschera o illustrazione unica viene usato per simulare gli slot.

Per aggiungere uno slot, inserire il catalogo in `ITEMS`, posizionarlo in `LAYER_ORDER`, aggiungere la selezione iniziale in `DEFAULT_STATE`, la categoria e il riquadro anteprima nella UI. Le geometrie sono esplorative, non asset definitivi. Braccia/guanti sono per ora un layer fisso; mantello e arma sono sostituibili. Gli elementi posteriori sono disegnati prima del corpo per una corretta sovrapposizione.

L'illustrazione `nymeria-art.png` del precedente prototipo è conservata ma non utilizzata.
