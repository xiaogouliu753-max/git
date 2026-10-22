(() => {
  "use strict";

  const processes = [
    { numeral: "壹", name: "煮茧抽丝", image: "assets/process-1.jpg", alt: "蚕茧抽丝线稿" },
    { numeral: "贰", name: "手摇转轴并丝、卷丝、分线", image: "assets/process-2.jpg", alt: "手摇纺车整理丝线线稿" },
    { numeral: "叁", name: "扎经防染（捆扎）", image: "assets/process-3.jpg", alt: "丝束捆扎防染线稿" },
    { numeral: "肆", name: "分层染色（多次扎染）", image: "assets/process-4.jpg", alt: "分层染色后的丝束线稿" },
    { numeral: "伍", name: "上机织造（织绸）", image: "assets/process-5.jpg", alt: "工匠使用织机织造艾德莱斯绸线稿" }
  ];

  const $ = (selector) => document.querySelector(selector);
  const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const intro = $("#intro");
  const experience = $("#experience");
  const recap = $("#recap");
  const processArea = $("#process-area");
  const processButton = $("#process-button");
  const processImage = $("#process-image");
  const processNumber = $("#process-number");
  const stepCounter = $("#step-counter");
  const progress = $("#progress");
  const nameReveal = $("#name-reveal");
  const nameNumber = $("#name-number");
  const nameText = $("#name-text");
  const processStrip = $("#process-strip");

  let currentIndex = 0;
  let transitioning = false;
  let trailActive = false;

  processes.forEach((process, index) => {
    const dot = document.createElement("span");
    dot.className = "progress-dot";
    dot.style.setProperty("--turn", `${-4 + index * 2}deg`);
    progress.append(dot);

    const item = document.createElement("li");
    item.className = "recap-item";
    item.innerHTML = `<img src="${process.image}" alt="${process.alt}"><p class="recap-label">${String(index + 1).padStart(2, "0")} · ${process.name}</p>`;
    processStrip.append(item);
  });

  const setActiveScreen = (screen) => {
    [intro, experience, recap].forEach((item) => item.classList.toggle("is-active", item === screen));
  };

  const updateProgress = () => {
    stepCounter.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(processes.length).padStart(2, "0")}`;
    [...progress.children].forEach((dot, index) => {
      dot.classList.toggle("is-done", index < currentIndex);
      dot.classList.toggle("is-current", index === currentIndex);
    });
  };

  const placeProcessRandomly = () => {
    const area = processArea.getBoundingClientRect();
    const card = processButton.getBoundingClientRect();
    const margin = 12;
    const maxLeft = Math.max(margin, area.width - card.width - margin);
    const maxTop = Math.max(margin, area.height - card.height - margin);
    processButton.style.left = `${margin + Math.random() * Math.max(0, maxLeft - margin)}px`;
    processButton.style.top = `${margin + Math.random() * Math.max(0, maxTop - margin)}px`;
    processButton.style.setProperty("--tilt", `${(Math.random() * 4 - 2).toFixed(2)}deg`);
  };

  const showProcess = () => {
    const process = processes[currentIndex];
    updateProgress();
    processNumber.textContent = process.numeral;
    processImage.src = process.image;
    processImage.alt = process.alt;
    processButton.setAttribute("aria-label", `第${currentIndex + 1}道工艺：${process.name}。点击继续。`);
    processButton.className = "process-button";
    processButton.style.display = "block";

    const reveal = () => {
      placeProcessRandomly();
      requestAnimationFrame(() => processButton.classList.add("is-visible"));
      processButton.focus({ preventScroll: true });
    };

    processImage.complete ? requestAnimationFrame(reveal) : processImage.addEventListener("load", reveal, { once: true });
  };

  const finishExperience = async () => {
    trailActive = false;
    setActiveScreen(recap);
    await sleep(450);
    document.querySelectorAll(".recap-item").forEach((item, index) => {
      setTimeout(() => item.classList.add("is-revealed"), index * 420);
    });
    $("#restart-button").focus({ preventScroll: true });
  };

  const advanceProcess = async () => {
    if (transitioning) return;
    transitioning = true;
    const process = processes[currentIndex];

    processButton.classList.remove("is-visible");
    processButton.classList.add("is-leaving");
    await sleep(1300);
    processButton.style.display = "none";

    nameNumber.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(processes.length).padStart(2, "0")}`;
    nameText.textContent = process.name;
    nameReveal.className = "name-reveal is-visible";
    await sleep(3000);
    nameReveal.classList.add("is-fading");
    await sleep(1000);
    nameReveal.className = "name-reveal";
    await sleep(2000);

    currentIndex += 1;
    if (currentIndex === processes.length) {
      transitioning = false;
      await finishExperience();
      return;
    }

    transitioning = false;
    showProcess();
  };

  const startExperience = async () => {
    currentIndex = 0;
    transitioning = false;
    trailActive = true;
    document.querySelectorAll(".recap-item").forEach((item) => item.classList.remove("is-revealed"));
    setActiveScreen(experience);
    await sleep(500);
    showProcess();
  };

  $("#start-button").addEventListener("click", startExperience);
  $("#restart-button").addEventListener("click", startExperience);
  processButton.addEventListener("click", advanceProcess);
  window.addEventListener("resize", () => {
    if (experience.classList.contains("is-active") && processButton.classList.contains("is-visible")) placeProcessRandomly();
  });

  const canvas = $("#silk-trail");
  const context = canvas.getContext("2d");
  const points = [];
  const lifetime = 2000;
  let lastPoint = null;

  const resizeCanvas = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const addTrailPoint = (event) => {
    if (!trailActive) return;
    const now = performance.now();
    const gap = !lastPoint || lastPoint.pointerId !== event.pointerId || now - lastPoint.time > 100;
    const point = { x: event.clientX, y: event.clientY, time: now, pointerId: event.pointerId, gap };
    points.push(point);
    lastPoint = point;
  };

  window.addEventListener("pointermove", addTrailPoint, { passive: true });
  window.addEventListener("pointerdown", addTrailPoint, { passive: true });
  window.addEventListener("pointerup", () => { lastPoint = null; }, { passive: true });
  window.addEventListener("pointercancel", () => { lastPoint = null; }, { passive: true });
  window.addEventListener("resize", resizeCanvas);

  const drawTrail = (now) => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    while (points.length && now - points[0].time > lifetime) points.shift();

    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalCompositeOperation = "multiply";

    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      if (to.gap || from.pointerId !== to.pointerId) continue;

      const age = now - to.time;
      const opacity = Math.max(0, 1 - age / lifetime);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const normalX = -dy / length;
      const normalY = dx / length;

      [-1.15, 0, 1.15].forEach((offset, strand) => {
        context.beginPath();
        context.moveTo(from.x + normalX * offset, from.y + normalY * offset);
        context.lineTo(to.x + normalX * offset, to.y + normalY * offset);
        context.lineWidth = strand === 1 ? 0.9 : 0.45;
        context.strokeStyle = strand === 2
          ? `rgba(190, 121, 98, ${opacity * 0.32})`
          : `rgba(35, 76, 126, ${opacity * (strand === 1 ? 0.62 : 0.38)})`;
        context.stroke();
      });
    }

    context.globalCompositeOperation = "source-over";
    requestAnimationFrame(drawTrail);
  };

  resizeCanvas();
  requestAnimationFrame(drawTrail);
})();
