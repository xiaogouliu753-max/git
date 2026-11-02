(() => {
  "use strict";

  const processSteps = [
    ["煮茧抽丝", "assets/v4/process-1.png"],
    ["并丝、卷丝、分线", "assets/v4/process-2.png"],
    ["图案设计", "assets/v4/process-3.png"],
    ["扎经防染", "assets/v4/process-4.png"],
    ["分层染色", "assets/v4/process-5.png"],
    ["解扎、水洗、晾干", "assets/v4/process-6.png"],
    ["整经、对花、穿综", "assets/v4/process-7.png"],
    ["上机织造", "assets/v4/process-8.png"],
    ["整理、验收", "assets/v4/process-9.png"]
  ];

  const patternSources = {
    1: "assets/v4/patterns-1.png",
    2: "assets/v4/patterns-2.png",
    3: "assets/v4/patterns-3.png",
    4: "assets/v4/patterns-4.png"
  };

  const sliderScreen = document.querySelector("#slider-screen");
  const transitionCard = document.querySelector("#transition-card");
  const deckShell = document.querySelector("#deck-shell");
  const processTrack = document.querySelector("#process-track");
  const slideNumber = document.querySelector("#slide-number");
  const slideName = document.querySelector("#slide-name");
  const slideDots = document.querySelector("#slide-dots");
  const completion = document.querySelector("#completion");
  const closeCompletion = document.querySelector("#close-completion");
  const patternFrame = document.querySelector("#pattern-frame");
  const patternImage = document.querySelector("#pattern-image");
  const canvas = document.querySelector("#silk-trail");
  const context = canvas.getContext("2d");

  let currentSlide = 0;
  let storyStarted = false;
  let dragStartX = null;
  let dragOffset = 0;
  let dragging = false;
  let finalTimer = 0;
  let transitionTimers = [];
  let trailActive = false;
  let lastTrailPoint = null;
  const trailPoints = [];
  const trailLifetime = 2000;

  processSteps.forEach(([name, source], index) => {
    const slide = document.createElement("figure");
    slide.className = "process-slide";
    slide.setAttribute("aria-label", `第 ${index + 1} 道工序：${name}`);

    const image = document.createElement("img");
    image.src = source;
    image.alt = `第 ${index + 1} 道工序：${name}`;
    image.draggable = false;
    image.loading = index < 2 ? "eager" : "lazy";
    image.decoding = "async";
    slide.append(image);
    processTrack.append(slide);

    const dot = document.createElement("span");
    dot.className = "slide-dot";
    slideDots.append(dot);
  });

  Object.values(patternSources).forEach((source) => {
    const preload = new Image();
    preload.src = source;
  });

  const deckWidth = () => deckShell.getBoundingClientRect().width || window.innerWidth * 0.9;

  const setTrackPosition = (offset = 0, animate = true) => {
    processTrack.style.transition = animate ? "" : "none";
    processTrack.style.transform = `translate3d(${-currentSlide * deckWidth() + offset}px, 0, 0)`;
  };

  const updateSlideStatus = () => {
    slideNumber.textContent = `${String(currentSlide + 1).padStart(2, "0")} / 09`;
    slideName.textContent = processSteps[currentSlide][0];
    [...slideDots.children].forEach((dot, index) => {
      dot.classList.toggle("is-current", index === currentSlide);
    });
  };

  const setTrailActive = (active) => {
    trailActive = active;
    trailPoints.length = 0;
    lastTrailPoint = null;
    if (!active) context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };

  function showCompletion() {
    if (!storyStarted || !completion.hidden) return;
    window.clearTimeout(finalTimer);
    setTrailActive(false);
    completion.hidden = false;
    requestAnimationFrame(() => completion.classList.add("is-visible"));
    window.setTimeout(() => closeCompletion.focus({ preventScroll: true }), 340);
  }

  const scheduleCompletion = () => {
    window.clearTimeout(finalTimer);
    if (currentSlide === processSteps.length - 1) {
      finalTimer = window.setTimeout(showCompletion, 1800);
    }
  };

  const goToSlide = (index) => {
    window.clearTimeout(finalTimer);
    currentSlide = Math.max(0, Math.min(processSteps.length - 1, index));
    dragOffset = 0;
    setTrackPosition(0, true);
    updateSlideStatus();
    scheduleCompletion();
  };

  const clearTransitionTimers = () => {
    transitionTimers.forEach((timer) => window.clearTimeout(timer));
    transitionTimers = [];
  };

  const startStory = () => {
    if (storyStarted) return;
    storyStarted = true;
    clearTransitionTimers();
    currentSlide = 0;
    updateSlideStatus();
    setTrackPosition(0, false);
    deckShell.classList.remove("is-visible");
    transitionCard.className = "transition-card";
    transitionCard.hidden = false;
    sliderScreen.classList.add("is-active");
    sliderScreen.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => transitionCard.classList.add("is-visible"));
    transitionTimers.push(window.setTimeout(() => transitionCard.classList.add("is-opening"), 620));
    transitionTimers.push(window.setTimeout(() => {
      transitionCard.hidden = true;
      transitionCard.className = "transition-card";
      deckShell.classList.add("is-visible");
      setTrackPosition(0, false);
      setTrailActive(true);
    }, 1120));
  };

  const resetStory = () => {
    clearTransitionTimers();
    window.clearTimeout(finalTimer);
    completion.classList.remove("is-visible");
    window.setTimeout(() => { completion.hidden = true; }, 280);
    storyStarted = false;
    currentSlide = 0;
    dragOffset = 0;
    dragging = false;
    setTrailActive(false);
    deckShell.classList.remove("is-visible");
    transitionCard.hidden = true;
    transitionCard.className = "transition-card";
    sliderScreen.classList.remove("is-active", "is-dragging");
    sliderScreen.setAttribute("aria-hidden", "true");
    updateSlideStatus();
    document.querySelector("#story").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => document.querySelector(".fabric-trigger-bottom").focus({ preventScroll: true }), 340);
  };

  document.querySelectorAll(".fabric-trigger").forEach((trigger) => {
    trigger.addEventListener("click", startStory);
  });

  deckShell.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !completion.hidden || !deckShell.classList.contains("is-visible")) return;
    window.clearTimeout(finalTimer);
    dragStartX = event.clientX;
    dragOffset = 0;
    dragging = true;
    sliderScreen.classList.add("is-dragging");
    deckShell.setPointerCapture(event.pointerId);
  });

  deckShell.addEventListener("pointermove", (event) => {
    if (!dragging || dragStartX === null) return;
    dragOffset = event.clientX - dragStartX;
    if ((currentSlide === 0 && dragOffset > 0) || (currentSlide === processSteps.length - 1 && dragOffset < 0)) {
      dragOffset *= 0.42;
    }
    setTrackPosition(dragOffset, false);
  });

  const finishSlideDrag = (event) => {
    if (!dragging || dragStartX === null) return;
    if (deckShell.hasPointerCapture(event.pointerId)) deckShell.releasePointerCapture(event.pointerId);
    dragging = false;
    dragStartX = null;
    sliderScreen.classList.remove("is-dragging");

    const threshold = Math.min(105, deckWidth() * 0.13);
    if (dragOffset <= -threshold) {
      if (currentSlide === processSteps.length - 1) showCompletion();
      else goToSlide(currentSlide + 1);
    } else if (dragOffset >= threshold && currentSlide > 0) {
      goToSlide(currentSlide - 1);
    } else {
      setTrackPosition(0, true);
      scheduleCompletion();
    }
    dragOffset = 0;
  };

  deckShell.addEventListener("pointerup", finishSlideDrag);
  deckShell.addEventListener("pointercancel", finishSlideDrag);

  closeCompletion.addEventListener("click", resetStory);
  completion.addEventListener("click", (event) => {
    if (event.target === completion) resetStory();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !completion.hidden) {
      resetStory();
      return;
    }
    if (!storyStarted || !completion.hidden || !deckShell.classList.contains("is-visible")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      currentSlide === processSteps.length - 1 ? showCompletion() : goToSlide(currentSlide + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToSlide(currentSlide - 1);
    }
  });

  let patternSwapToken = 0;
  const showPattern = (pattern) => {
    const source = patternSources[pattern] || patternSources[1];
    if (patternImage.getAttribute("src") === source) return;
    const token = ++patternSwapToken;
    patternImage.classList.add("is-changing");
    window.setTimeout(() => {
      if (token !== patternSwapToken) return;
      patternImage.src = source;
      patternImage.classList.remove("is-changing");
    }, 55);
  };

  document.querySelectorAll(".pattern-hotspot").forEach((hotspot) => {
    const pattern = hotspot.dataset.pattern;
    hotspot.addEventListener("pointerenter", () => showPattern(pattern));
    hotspot.addEventListener("focus", () => showPattern(pattern));
    hotspot.addEventListener("click", () => showPattern(pattern));
  });
  patternFrame.addEventListener("pointerleave", () => showPattern(1));

  const resizeCanvas = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const addTrailSample = (x, y, pointerId, time) => {
    if (!trailActive) return;
    const gap = !lastTrailPoint || lastTrailPoint.pointerId !== pointerId || time - lastTrailPoint.time > 120;
    const point = { x, y, time, pointerId, gap };
    trailPoints.push(point);
    lastTrailPoint = point;
  };

  const addTrailPoint = (event) => {
    if (!trailActive) return;
    const samples = event.getCoalescedEvents?.() || [event];
    samples.forEach((sample) => addTrailSample(sample.clientX, sample.clientY, event.pointerId, performance.now()));
  };

  window.addEventListener("pointermove", addTrailPoint, { passive: true });
  window.addEventListener("pointerdown", addTrailPoint, { passive: true });
  window.addEventListener("pointerup", () => { lastTrailPoint = null; }, { passive: true });
  window.addEventListener("pointercancel", () => { lastTrailPoint = null; }, { passive: true });

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

  const drawSilkFan = (from, to, now, opacity) => {
    for (let strand = -5; strand <= 5; strand += 1) {
      const fromAge = Math.min(1, (now - from.time) / trailLifetime);
      const toAge = Math.min(1, (now - to.time) / trailLifetime);
      const fromOffset = strand * (0.42 + fromAge * 2.75) + Math.sin(from.time * 0.018 + strand) * fromAge;
      const toOffset = strand * (0.42 + toAge * 2.75) + Math.sin(to.time * 0.018 + strand) * toAge;
      const central = strand === 0;
      drawOffsetLine(
        from,
        to,
        fromOffset,
        toOffset,
        central ? 1.25 : 0.52,
        `rgba(58, 65, 146, ${opacity * (central ? 0.58 : 0.27)})`
      );
    }
  };

  const drawTrail = (now) => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    while (trailPoints.length && now - trailPoints[0].time > trailLifetime) trailPoints.shift();

    if (trailActive) {
      context.lineCap = "round";
      context.lineJoin = "round";
      context.globalCompositeOperation = "multiply";
      for (let index = 1; index < trailPoints.length; index += 1) {
        const from = trailPoints[index - 1];
        const to = trailPoints[index];
        if (to.gap || from.pointerId !== to.pointerId) continue;
        const opacity = Math.max(0, 1 - (now - to.time) / trailLifetime);
        drawSilkFan(from, to, now, opacity);
      }
      context.globalCompositeOperation = "source-over";
    }

    requestAnimationFrame(drawTrail);
  };

  window.addEventListener("resize", () => {
    resizeCanvas();
    if (storyStarted) setTrackPosition(0, false);
  });

  updateSlideStatus();
  resizeCanvas();
  requestAnimationFrame(drawTrail);
})();
