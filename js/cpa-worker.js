self.onmessage = e => {
  const { own, tgt } = e.data;
  const rx = tgt.x - own.x;
  const ry = tgt.y - own.y;
  const vx = tgt.vx - own.vx;
  const vy = tgt.vy - own.vy;
  const v2 = vx * vx + vy * vy;
  const tCPA = v2 < 1e-6 ? 1e9 : -(rx * vx + ry * vy) / v2;
  const xCPA = rx + vx * tCPA;
  const yCPA = ry + vy * tCPA;
  const dCPA = Math.sqrt(xCPA * xCPA + yCPA * yCPA);
  self.postMessage({ t: tCPA, d: dCPA });
};
