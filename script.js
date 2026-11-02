(() => {
  "use strict";

  const processSteps = [
    ["煮茧抽丝", "assets/v3/process-1.png"],
    ["并丝、卷丝、分线", "assets/v3/process-2.png"],
    ["图案设计", "assets/v3/process-3.png"],
    ["扎经防染", "assets/v3/process-4.png"],
    ["分层染色", "assets/v3/process-5.png"],
    ["解扎、水洗、晾干", "assets/v3/process-6.png"],
    ["整经、对花、穿综", "assets/v3/process-7.png"],
    ["上机织造", "assets/v3/process-8.png"],
    ["整理、验收", "assets/v3/process-9.png"]
  ];

  const patternSources = {
    1: "assets/v3/patterns-focus-1.png",
    2: "assets/v3/patterns-focus-2.png",
    3: "assets/v3/patterns-focus-3.png",
    4: "assets/v3/patterns-focus-4.png"
  };

  const basePatternSource = "assets/v3/patterns-base.png";
  const homeScreen = document.querySelector("#home-screen");
  const sliderScreen = document.querySelector("#slider-screen");
  const enterStory = document.querySelector("#enter-story");
  const processTrack = document.querySelector("#process-track");
  const slideNumber = document.querySelector("#slide-number");
  const slideName = document.querySelector("#slide-name");
  const slideDots = document.querySelector("#slide-dots");
  const completion = document.querySelector("#completion");
  const closeCompletion = document.querySelector("#close-completion");
  const archiveFrame = document.querySelector("#archive-frame");
  const archiveImage = document.querySelector("#archive-image");
  const canvas = document.querySelector("#silk-trail");
  const context = canvas.getContext("2d");

  let currentSlide = 0;
  let storyStarted = false;
  let dragStartX = null;
  let dragOffset = 0;
  let dragging = false;
  let lastIntroDrag = 0;
  let finalTimer = 0;
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

  const setTrackPosition = (offset = 0, animate = true) => {
    processTrack.style.transition = animate ? "" : "none";
    processTrack.style.transform = `translate3d(calc(${-currentSlide * 100}vw + ${offset}px), 0, 0)`;
  };

  const updateSlideStatus = () => {
    slideNumber.textContent = String(currentSlide + 1).padStart(2, "0");
    slideName.textContent = processSteps[currentSlide][0];
    [...slideDots.children].forEach((dot, index) => {
      dot.classList.toggle("is-current", index === currentSlide);
    });
  };

  const scheduleCompletion = () => {
    window.clearTimeout(finalTimer);
    if (currentSlide !== processSteps.length - 1) return;
    finalTimer = window.setTimeout(showCompletion, 1800);
  };

  const goToSlide = (index) => {
    window.clearTimeout(finalTimer);
    currentSlide = Math.max(0, Math.min(processSteps.length - 1, index));
    dragOffset = 0;
    setTrackPosition(0, true);
    updateSlideStatus();
    scheduleCompletion();
  };

  const setTrailActive = (active) => {
    trailActive = active;
    trailPoints.length = 0;
    lastTrailPoint = null;
    if (!active) context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };

  const startStory = () => {
    if (storyStarted) return;
    storyStarted = true;
    enterStory.classList.add("is-leaving");
    window.setTimeout(() => {
      homeScreen.classList.remove("is-active");
      sliderScreen.classList.add("is-active");
      sliderScreen.setAttribute("aria-hidden", "false");
      currentSlide = 0;
      setTrackPosition(0, false);
      updateSlideStatus();
      setTrailActive(true);
    }, 300);
  };

  function showCompletion() {
    if (!storyStarted || !completion.hidden) return;
    window.clearTimeout(finalTimer);
    setTrailActive(false);
    completion.hidden = false;
    requestAnimationFrame(() => completion.classList.add("is-visible"));
    window.setTimeout(() => closeCompletion.focus({ preventScroll: true }), 340);
  }

  const resetStory = () => {
    completion.classList.remove("is-visible");
    window.setTimeout(() => {
      completion.hidden = true;
    }, 300);
    storyStarted = false;
    currentSlide = 0;
    dragOffset = 0;
    setTrailActive(false);
    sliderScreen.classList.remove("is-active");
    sliderScreen.setAttribute("aria-hidden", "true");
    homeScreen.classList.add("is-active");
    enterStory.classList.remove("is-leaving");
    enterStory.style.setProperty("--intro-x", "0px");
    updateSlideStatus();
    document.querySelector("#story").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => enterStory.focus({ preventScroll: true }), 360);
  };

  enterStory.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragStartX = event.clientX;
    dragOffset = 0;
    enterStory.setPointerCapture(event.pointerId);
  });

  enterStory.addEventListener("pointermove", (event) => {
    if (dragStartX === null) return;
    dragOffset = event.clientX - dragStartX;
    enterStory.style.setProperty("--intro-x", `${dragOffset}px`);
  });

  const finishIntroDrag = (event) => {
    if (dragStartX === null) return;
    if (enterStory.hasPointerCapture(event.pointerId)) enterStory.releasePointerCapture(event.pointerId);
    const moved = Math.abs(dragOffset);
    dragStartX = null;
    enterStory.style.setProperty("--intro-x", "0px");
    if (moved >= 48) {
      lastIntroDrag = performance.now();
      startStory();
    }
  };

  enterStory.addEventListener("pointerup", finishIntroDrag);
  enterStory.addEventListener("pointercancel", finishIntroDrag);
  enterStory.addEventListener("click", () => {
    if (performance.now() - lastIntroDrag > 400) startStory();
  });

  sliderScreen.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !completion.hidden) return;
    window.clearTimeout(finalTimer);
    dragStartX = event.clientX;
    dragOffset = 0;
    dragging = true;
    sliderScreen.classList.add("is-dragging");
    sliderScreen.setPointerCapture(event.pointerId);
  });

  sliderScreen.addEventListener("pointermove", (event) => {
    if (!dragging || dragStartX === null) return;
    dragOffset = event.clientX - dragStartX;
    if ((currentSlide === 0 && dragOffset > 0) || (currentSlide === processSteps.length - 1 && dragOffset < 0)) {
      dragOffset *= 0.42;
    }
    setTrackPosition(dragOffset, false);
  });

  const finishSlideDrag = (event) => {
    if (!dragging || dragStartX === null) return;
    if (sliderScreen.hasPointerCapture(event.pointerId)) sliderScreen.releasePointerCapture(event.pointerId);
    dragging = false;
    dragStartX = null;
    sliderScreen.classList.remove("is-dragging");

    const threshold = Math.min(110, window.innerWidth * 0.12);
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

  sliderScreen.addEventListener("pointerup", finishSlideDrag);
  sliderScreen.addEventListener("pointercancel", finishSlideDrag);

  closeCompletion.addEventListener("click", resetStory);
  completion.addEventListener("click", (event) => {
    if (event.target === completion) resetStory();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !completion.hidden) {
      resetStory();
      return;
    }
    if (!storyStarted || !completion.hidden) return;
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
    const source = pattern ? patternSources[pattern] : basePatternSource;
    if (archiveImage.getAttribute("src") === source) return;
    const token = ++patternSwapToken;
    archiveImage.classList.add("is-changing");
    window.setTimeout(() => {
      if (token !== patternSwapToken) return;
      archiveImage.src = source;
      archiveImage.classList.remove("is-changing");
    }, 70);
  };

  document.querySelectorAll(".pattern-hotspot").forEach((hotspot) => {
    const pattern = hotspot.dataset.pattern;
    hotspot.addEventListener("pointerenter", () => showPattern(pattern));
    hotspot.addEventListener("focus", () => showPattern(pattern));
    hotspot.addEventListener("click", () => showPattern(pattern));
    hotspot.addEventListener("blur", () => showPattern(null));
  });
  archiveFrame.addEventListener("pointerleave", () => showPattern(null));

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
