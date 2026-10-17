/* Potenza: un solo numero che riassume attacco e vita secondo il ruolo della classe */
const PWW={tank:[2.5,.5],dps:[5.5,.35],sup:[4.5,.45],heal:[5,.45]};
function pw(){const w=PWW[CL[S.spec].role]||PWW.dps,b=BF();return Math.round(atk()/(1+b.at)*w[0]+mhp()/(1+b.hp)*w[1])}
function pwWith(k,u){const o=S.eq[k];S.eq[k]=u;const v=pw();S.eq[k]=o;return v}
