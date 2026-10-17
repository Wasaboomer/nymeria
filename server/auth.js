// Account e sessioni. Password con scrypt + sale; token casuali, nel database solo il loro hash.
const crypto = require('crypto');
const DAY = 864e5, SESSION_DAYS = 30;

const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const scrypt = (pass, salt) => crypto.scryptSync(pass, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');

const USER_RE = /^[A-Za-z0-9_]{3,16}$/;
function checkCredentials(user, pass) {
  if (typeof user !== 'string' || !USER_RE.test(user)) return 'Il nome account deve avere 3-16 caratteri: lettere, numeri o _.';
  if (typeof pass !== 'string' || pass.length < 8 || pass.length > 128) return 'La password deve avere da 8 a 128 caratteri.';
  return null;
}

function createAuth(db) {
  const q = {
    find: db.prepare('SELECT * FROM accounts WHERE user = ?'),
    add: db.prepare('INSERT INTO accounts (user, salt, hash, created) VALUES (?, ?, ?, ?)'),
    sessAdd: db.prepare('INSERT INTO sessions (token_hash, account_id, expires) VALUES (?, ?, ?)'),
    sessGet: db.prepare('SELECT a.id, a.user, s.expires FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.token_hash = ?'),
    sessDel: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    sessClean: db.prepare('DELETE FROM sessions WHERE expires < ?'),
  };
  function newSession(accountId) {
    const token = crypto.randomBytes(32).toString('hex');
    q.sessClean.run(Date.now());
    q.sessAdd.run(sha(token), accountId, Date.now() + SESSION_DAYS * DAY);
    return token;
  }
  return {
    register(user, pass) {
      const err = checkCredentials(user, pass);
      if (err) return { error: err, status: 400 };
      if (q.find.get(user)) return { error: 'Questo nome account è già in uso.', status: 409 };
      const salt = crypto.randomBytes(16).toString('hex');
      const info = q.add.run(user, salt, scrypt(pass, salt), Date.now());
      return { token: newSession(Number(info.lastInsertRowid)), user };
    },
    login(user, pass) {
      const bad = { error: 'Nome account o password errati.', status: 401 };
      if (typeof user !== 'string' || typeof pass !== 'string' || pass.length > 128) return bad;
      const a = q.find.get(user);
      // si calcola comunque l'hash, così il tempo di risposta non rivela se l'account esiste
      const h = scrypt(pass, a ? a.salt : '00'.repeat(16));
      if (!a || !crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(a.hash, 'hex'))) return bad;
      return { token: newSession(a.id), user: a.user };
    },
    verify(token) {
      if (typeof token !== 'string' || token.length !== 64) return null;
      const s = q.sessGet.get(sha(token));
      if (!s || s.expires < Date.now()) return null;
      return { id: s.id, user: s.user };
    },
    logout(token) { if (typeof token === 'string') q.sessDel.run(sha(token)); },
  };
}
module.exports = { createAuth, checkCredentials };
