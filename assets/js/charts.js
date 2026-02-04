function drawPlaceholderBar(canvasId, labels, values, unit) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  const pad = 30;
  const w = c.width - pad * 2;
  const h = c.height - pad * 2;

  // axes
  ctx.strokeStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, pad + h);
  ctx.lineTo(pad + w, pad + h);
  ctx.stroke();

  const max = Math.max(...values, 1);
  const barW = w / values.length * 0.6;
  values.forEach((v, i) => {
    const x = pad + (w / values.length) * i + (w / values.length - barW) / 2;
    const barH = (v / max) * (h * 0.85);
    const y = pad + h - barH;

    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(x, y, barW, barH);

    ctx.fillStyle = "#475569";
    ctx.font = "12px system-ui";
    ctx.fillText(labels[i], x, pad + h + 16);
    ctx.fillText(`${v}${unit ? " " + unit : ""}`, x, y - 6);
  });
}

function drawPlaceholderLine(canvasId, labels, values) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  const pad = 30;
  const w = c.width - pad * 2;
  const h = c.height - pad * 2;

  ctx.strokeStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, pad + h);
  ctx.lineTo(pad + w, pad + h);
  ctx.stroke();

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);

  ctx.strokeStyle = "#64748b";
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + (w * i) / (values.length - 1);
    const y = pad + h - ((v - min) / span) * (h * 0.85);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // labels
  ctx.fillStyle = "#475569";
  ctx.font = "12px system-ui";
  labels.forEach((lab, i) => {
    const x = pad + (w * i) / (labels.length - 1);
    ctx.fillText(lab, x - 10, pad + h + 16);
  });
}
