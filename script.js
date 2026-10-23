(() => {
  "use strict";

  const processes = [
    { numeral: "壹", name: "煮茧抽丝", type: "image", source: "assets/process-1.png", width: "clamp(150px, 20vw, 310px)", aspect: "1186 / 1570", mediaWidth: "133.81%", mediaY: "-8.46%", transparent: true, alt: "手持蚕茧抽丝线稿" },
    { numeral: "贰", name: "手摇转轴并丝、卷丝、分线", type: "image", source: "assets/process-2.jpg", width: "clamp(190px, 27vw, 410px)", aspect: "510 / 449", alt: "手摇纺车整理丝线线稿" },
    { numeral: "叁", name: "扎经防染（捆扎）", type: "image", source: "assets/process-3.png", width: "clamp(220px, 31vw, 480px)", aspect: "1587 / 711", mediaY: "-3.25%", transparent: true, alt: "丝束捆扎防染线稿" },
    { numeral: "肆", name: "分层染色（多次扎染）", type: "image", source: "assets/process-4.png", width: "clamp(220px, 31vw, 480px)", aspect: "1587 / 793", mediaY: "-26.41%", transparent: true, alt: "分层染色后的丝束线稿" },
    { numeral: "伍", name: "上机织造（织绸）", type: "video", source: "assets/process-5.mp4", width: "clamp(240px, 34vw, 520px)", aspect: "16 / 9", alt: "工匠使用织机织造艾德莱斯绸" }
  ];

  const $ = (selector) => document.querySelector(selector);
  const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const intro = $("#intro");
  const experience = $("#experience");
  const recap = $("#recap");
  const processArea = $("#process-area");
  const processButton = $("#process-button");
  const processImage = $("#process-image");
  const processVideo = $("#process-video");
  const processNumber = $("#process-number");
  const stepCounter = $("#step-counter");
  const progress = $("#progress");
  const nameReveal = $("#name-reveal");
  const nameNumber = $("#name-number");
  const nameText = $("#name-text");
  const processStrip = $("#process-strip");
  const canvas = $("#silk-trail");
  const context = canvas.getContext("2d");

  let currentIndex = 0;
  let transitioning = false;
  let trailMode = 0;
  let lastPoint = null;
  const points = [];
  const lifetime = 2000;

  processes.forEach((process, index) => {
    const dot = document.createElement("span");
    dot.className = "progress-dot";
    dot.style.setProperty("--turn", `${-4 + index * 2}deg`);
    progress.append(dot);

    const item = document.createElement("li");
    item.className = "recap-item";
    const media = document.createElement(process.type === "video" ? "video" : "img");
    if (process.transparent) media.className = "transparent-art";
    media.src = process.source;
    if (process.type === "video") {
      media.muted = true;
      media.loop = true;
      media.autoplay = true;
      media.playsInline = true;
      media.preload = "metadata";
      media.setAttribute("aria-label", process.alt);
    } else {
      media.alt = process.alt;
    }
    const label = document.createElement("p");
    label.className = "recap-label";
    label.textContent = `${String(index + 1).padStart(2, "0")} · ${process.name}`;
    item.append(media, label);
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
    const xRange = Math.max(0, area.width - card.width - margin * 2);
    const yRange = Math.max(0, area.height - card.height - margin * 2);
    processButton.style.left = `${margin + Math.random() * xRange}px`;
    processButton.style.top = `${margin + Math.random() * yRange}px`;
    processButton.style.setProperty("--tilt", `${(Math.random() * 4 - 2).toFixed(2)}deg`);
  };

  const revealProcess = () => {
    placeProcessRandomly();
    requestAnimationFrame(() => processButton.classList.add("is-visible"));
    processButton.focus({ preventScroll: true });
  };

  const showProcess = () => {
    const process = processes[currentIndex];
    updateProgress();
    processNumber.textContent = process.numeral;
    processButton.setAttribute("aria-label", `第${currentIndex + 1}道工艺：${process.name}。点击继续。`);
    processButton.style.setProperty("--process-width", process.width);
    processButton.style.setProperty("--process-aspect", process.aspect);
    processButton.style.setProperty("--media-width", process.mediaWidth || "100%");
    processButton.style.setProperty("--media-y", process.mediaY || "0%");
    processButton.className = "process-button";
    processButton.style.display = "block";

    if (process.type === "video") {
      processImage.hidden = true;
      processVideo.hidden = false;
      processVideo.setAttribute("aria-label", process.alt);
      if (!processVideo.src.endsWith(process.source)) {
        processVideo.src = process.source;
        processVideo.load();
      }
      processVideo.readyState >= 2
        ? requestAnimationFrame(revealProcess)
        : processVideo.addEventListener("loadeddata", revealProcess, { once: true });
      processVideo.play().catch(() => {});
      return;
    }

    processVideo.pause();
    processVideo.hidden = true;
    processImage.hidden = false;
    processImage.className = `process-media${process.transparent ? " transparent-art" : ""}`;
    processImage.src = process.source;
    processImage.alt = process.alt;
    processImage.complete
      ? requestAnimationFrame(revealProcess)
      : processImage.addEventListener("load", revealProcess, { once: true });
  };

  const setTrailMode = (mode, event) => {
    trailMode = mode;
    points.length = 0;
    lastPoint = null;
    if (mode && event?.detail && Number.isFinite(event.clientX)) {
      addTrailSample(event.clientX, event.clientY, event.pointerId || 1, performance.now());
    }
  };

  const finishExperience = async () => {
    setTrailMode(0);
    processVideo.pause();
    setActiveScreen(recap);
    await sleep(450);
    document.querySelectorAll(".recap-item").forEach((item, index) => {
      setTimeout(() => item.classList.add("is-revealed"), index * 420);
    });
    $("#restart-button").focus({ preventScroll: true });
  };

  const advanceProcess = async (event) => {
    if (transitioning) return;
    transitioning = true;
    const process = processes[currentIndex];

    if (currentIndex === 0) setTrailMode(1, event);
    if (currentIndex === 1) setTrailMode(2, event);
    if (currentIndex === 3) setTrailMode(3, event);

    processButton.classList.remove("is-visible");
    processButton.classList.add("is-leaving");
    await sleep(1300);
    processButton.style.display = "none";
    if (process.type === "video") processVideo.pause();

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
    setTrailMode(0);
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

  const resizeCanvas = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  function addTrailSample(x, y, pointerId, time) {
    if (!trailMode) return;
    const gap = !lastPoint || lastPoint.pointerId !== pointerId || time - lastPoint.time > 120;
    const point = { x, y, time, pointerId, gap };
    points.push(point);
    lastPoint = point;
  }

  const addTrailPoint = (event) => {
    if (!trailMode) return;
    const samples = event.getCoalescedEvents?.() || [event];
    samples.forEach((sample) => addTrailSample(sample.clientX, sample.clientY, event.pointerId, performance.now()));
  };

  window.addEventListener("pointermove", addTrailPoint, { passive: true });
  window.addEventListener("pointerdown", addTrailPoint, { passive: true });
  window.addEventListener("pointerup", () => { lastPoint = null; }, { passive: true });
  window.addEventListener("pointercancel", () => { lastPoint = null; }, { passive: true });
  window.addEventListener("resize", resizeCanvas);

  const drawOffsetLine = (from, to, fromOffset, toOffset, width, color) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    context.beginPath();
    context.moveTo(from.x + normalX * fromOffset, from.y + normalY * fromOffset);
    context.lineTo(to.x + normalX * toOffset, to.y + normalY * toOffset);
    context.lineWidth = width;
    context.strokeStyle = color;
    context.stroke();
  };

  const drawFineThread = (from, to, opacity) => {
    [
      [-1.5, 0.8, `rgba(121, 110, 174, ${opacity * 0.42})`],
      [0, 2.2, `rgba(54, 61, 126, ${opacity * 0.78})`],
      [1.5, 0.7, `rgba(175, 157, 203, ${opacity * 0.48})`]
    ].forEach(([offset, width, color]) => drawOffsetLine(from, to, offset, offset, width, color));
  };

  const drawSilkFan = (from, to, now, opacity) => {
    for (let strand = -4; strand <= 4; strand += 1) {
      const fromAge = Math.min(1, (now - from.time) / lifetime);
      const toAge = Math.min(1, (now - to.time) / lifetime);
      const fromOffset = strand * (0.45 + fromAge * 2.6) + Math.sin(from.time * 0.018 + strand) * fromAge;
      const toOffset = strand * (0.45 + toAge * 2.6) + Math.sin(to.time * 0.018 + strand) * toAge;
      drawOffsetLine(from, to, fromOffset, toOffset, strand === 0 ? 1.25 : 0.55, `rgba(61, 66, 145, ${opacity * (strand === 0 ? 0.6 : 0.3)})`);
    }
  };

  const drawDyedRibbon = (from, to, opacity) => {
    const colors = [
      ["214, 49, 60", 3.2],
      ["33, 103, 157", 2.5],
      ["235, 166, 40", 2.9],
      ["26, 115, 91", 3.1],
      ["218, 104, 119", 1.1]
    ];
    colors.forEach(([color, width], index) => {
      const offset = (index - 2) * 2.1 + Math.sin(from.time * 0.013 + index) * 0.8;
      const nextOffset = (index - 2) * 2.1 + Math.sin(to.time * 0.013 + index) * 0.8;
      drawOffsetLine(from, to, offset, nextOffset, width, `rgba(${color}, ${opacity * 0.54})`);
    });
  };

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
      const opacity = Math.max(0, 1 - (now - to.time) / lifetime);
      if (trailMode === 1) drawFineThread(from, to, opacity);
      if (trailMode === 2) drawSilkFan(from, to, now, opacity);
      if (trailMode === 3) drawDyedRibbon(from, to, opacity);
    }

    context.globalCompositeOperation = "source-over";
    requestAnimationFrame(drawTrail);
  };

  resizeCanvas();
  requestAnimationFrame(drawTrail);
})();
