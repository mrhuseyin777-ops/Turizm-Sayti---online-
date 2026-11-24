// Sadə yaddaşdaxili iş növbəsi: müraciət cavabını gecikdirmədən bildirişləri arxa planda göndərir.
//  - push(job) dərhal qayıdır; iş setImmediate ilə növbəti tick-də başlayır
//  - uğursuz iş `retries` dəfə yenidən cəhd edilir (eksponensial backoff: base, 2×base, 4×base …)
//  - err.retryable === false (məs. Telegram 400/403: chat_id yanlışdır) → yenidən cəhd edilmir
//  - növbə dolubsa (maxSize) yeni iş atılır və loglanır (yaddaş tükənməsin)
// Növbə prosesin yaddaşındadır: yenidən başlamada göndərilməmiş bildirişlər itir (müraciətin özü saxlanılıb).
function createQueue({ retries = 3, baseDelayMs = 1000, concurrency = 2, maxSize = 500, onError = () => {}, onDrop = () => {} } = {}) {
  const pending = [];
  let active = 0;
  const idleWaiters = [];
  const timers = new Set();

  const settleIdle = () => {
    if (active === 0 && pending.length === 0 && timers.size === 0) idleWaiters.splice(0).forEach((r) => r());
  };

  function pump() {
    while (active < concurrency && pending.length) {
      const job = pending.shift();
      active++;
      Promise.resolve()
        .then(() => job.run())
        .then(() => { active--; pump(); settleIdle(); }, (err) => {
          active--;
          job.attempt++;
          const final = job.attempt > retries || (err && err.retryable === false);
          onError(err, { name: job.name, attempt: job.attempt, final });
          if (!final) {
            const t = setTimeout(() => { timers.delete(t); pending.push(job); pump(); }, baseDelayMs * 2 ** (job.attempt - 1));
            if (t.unref) t.unref();
            timers.add(t);
          }
          pump();
          settleIdle();
        });
    }
  }

  return {
    push(name, run) {
      if (pending.length >= maxSize) { onDrop({ name }); return false; }
      pending.push({ name, run, attempt: 0 });
      setImmediate(pump);
      return true;
    },
    size: () => pending.length + active + timers.size,
    // Testlər/dayandırma üçün: bütün işlər (retry-lar daxil) bitənə qədər gözlə
    idle() { return new Promise((r) => { idleWaiters.push(r); setImmediate(settleIdle); }); },
    clear() { pending.length = 0; for (const t of timers) clearTimeout(t); timers.clear(); settleIdle(); },
  };
}

module.exports = { createQueue };
