// ---- Regole ----
const APP=()=>{const e={};Object.keys(S.eq).forEach(k=>e[k]=bt(S.eq[k]));return S.lv>=10?{...e,...S.gl}:e};
const BF=()=>{const b=S.buf&&NOW()<S.buf.t?S.buf:{hp:0,at:0},h=typeof HER==='function'?HER():null;return h?{...b,hp:(b.hp||0)+h.hp,at:(b.at||0)+h.at}:b},atk=()=>(CL[S.spec].at+S.lv*CL[S.spec].atl+QV(WEAP,S.eq.w)+QV(GLO,S.eq.g))*(1+BF().at),mhp=()=>Math.round((CL[S.spec].hp+S.lv*CL[S.spec].hpl+QV(ARM,S.eq.a)+QV(HEL,S.eq.h)+QV(BOO,S.eq.f)+QV(OFF,S.eq.o))*(S.race==='kharun'?1.1:1)*(1+BF().hp));
const fac=(elv,d)=>(d||1)*clamp(1+.1*(elv-S.lv),.3,1.5);
function addXp(x){let up=0;if(S.lv>=MAXL)return 0;S.xp+=x;while(S.lv<MAXL&&S.xp>=need(S.lv)){S.xp-=need(S.lv);S.lv++;up++}return up}

