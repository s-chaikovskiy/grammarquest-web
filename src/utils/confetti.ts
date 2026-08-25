import confetti from 'canvas-confetti';

export function fireConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

/**
 * Отклик на верный ответ.
 *
 * Цвета взяты из палитры приложения: прежние сиреневый и индиго не совпадали
 * ни с одним элементом интерфейса и выглядели чужими. Частиц вдвое меньше —
 * этот всплеск повторяется после каждого верного ответа, и щедрая горсть
 * конфетти на десятом подряд начинает раздражать.
 *
 * z-index берётся из шкалы слоёв, а не выставляется числом 9999.
 */
export function fireSuccess() {
  confetti({
    particleCount: 55,
    spread: 62,
    startVelocity: 34,
    decay: 0.92,
    scalar: 0.9,
    origin: { y: 0.62 },
    colors: ['#0064B9', '#00793D', '#C89B3C'],
    zIndex: 300,
  });
}

export function fireAchievement() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#6366F1', '#8B5CF6', '#EC4899'],
      zIndex: 9999,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#6366F1', '#8B5CF6', '#EC4899'],
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}