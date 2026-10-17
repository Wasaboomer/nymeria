function arrive(){S.loc=S.tr.to;S.tr=null;qa('trav',1);const L=LC[S.loc];if(ND.some(n=>n.loc===S.loc&&MR[n.m]>=1)&&rnd()<.18){S.hv={loc:S.loc,id:'h_'+S.loc+'_'+NOW(),exp:NOW()+30*60000};show('Esplorando il luogo noti un filone nascosto. Resterà visibile per mezz’ora.')}save();render();
 travelEvent(L)}
