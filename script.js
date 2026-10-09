/* =========================================================
   BIRTHDAY STORY — COMPLETE SCRIPT
   For Didi ♡
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {
        loaderDuration: 5200,
        sectionThreshold: 0.18,
        particleCount: 22,
        puzzleSize: 3,
        maxWishLength: 180
    };


    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const byId = id =>
        document.getElementById(id);

    const clamp = (value, min, max) =>
        Math.min(Math.max(value, min), max);

    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));


    /* =====================================================
       STATE
    ===================================================== */

    const state = {
        loaderFinished: false,
        musicPlaying: false,

        currentSection: 0,

        giftOpened: false,

        selectedWish: null,

        puzzleStarted: false,
        puzzleSolved: false,
        puzzleMoves: 0,
        puzzleSelected: null,
        puzzleTiles: [],

        personalWish: "",

        cakeBlown: false,
        cakePressTimer: null,
        cakePressStart: 0
    };


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const loader = byId("loader");
    const loaderText = byId("loaderText");
    const loaderPercentage = byId("loaderPercentage");
    const loaderProgress = byId("loaderProgress");
    const loaderProgressText = byId("loaderProgressText");
    const loaderStatusIcon = byId("loaderStatusIcon");
    const loaderQuote = byId("loaderQuote");
    const loaderComplete = byId("loaderComplete");

    const experience = byId("experience");

    const music = byId("backgroundMusic");
    const musicToggle = byId("musicToggle");

    const toast = byId("toast");
    const toastText = byId("toastText");

    const transitionOverlay = byId("transitionOverlay");

    const storyProgress = byId("storyProgressFill");

    const startButton = byId("startButton");

    const giftBox = byId("giftBox");
    const giftHint = byId("giftHint");
    const giftReveal = byId("giftReveal");

    const wishResult = byId("wishResult");
    const wishResultText = byId("wishResultText");

    const puzzleIntro = byId("puzzleIntro");
    const puzzleGame = byId("puzzleGame");
    const puzzleReveal = byId("puzzleReveal");

    const startPuzzleButton = byId("startPuzzleButton");
    const puzzleBoard = byId("puzzleBoard");
    const puzzleMoves = byId("puzzleMoves");
    const puzzleHint = byId("puzzleHint");
    const puzzleShuffle = byId("puzzleShuffle");
    const puzzleFeedback = byId("puzzleFeedback");
    const puzzleContinue = byId("puzzleContinue");

    const personalWish = byId("personalWish");
    const wishCharacterCount = byId("wishCharacterCount");
    const saveWishButton = byId("saveWishButton");
    const savedWish = byId("savedWish");

    const birthdayCake = byId("birthdayCake");
    const cakeFlame = byId("cakeFlame");
    const cakeHint = byId("cakeHint");
    const cakeWishMessage = byId("cakeWishMessage");

    const nightStars = byId("nightStars");

    const downloadCertificate = byId("downloadCertificate");

    const finalParticles = byId("finalParticles");

    const restartButton = byId("restartButton");


    /* =====================================================
       SECTION NAVIGATION — CINEMATIC SINGLE-PAGE MODE
    ===================================================== */

    /* The current HTML contains these chapters only.
       Keeping this list in sync prevents the old removed chapters
       (numbers/open/question/cake/certificate) from shifting every
       later chapter to the wrong index. */
    const sectionIds = [
        "heroSection",
        "introSection",
        "giftSection",
        "timelineSection",
        "memoriesSection",
        "thingsSection",
        "letterSection",
        "wishSection",
        "puzzleSection",
        "nightSection",
        "finalMessageSection",
        "goodbyeSection"
    ];

    const sections = sectionIds
        .map(id => byId(id))
        .filter(Boolean);

    let navigationLocked = false;
    let touchStartY = 0;
    let touchStartX = 0;

    function updateStoryProgress() {
        document.body.dataset.chapter = state.currentSection;
        const count = byId("navCount");
        if (count) count.textContent = `${state.currentSection + 1} / ${sections.length}`;
        const pv = byId("navPrev"), nx = byId("navNext");
        if (pv) pv.disabled = state.currentSection === 0;
        if (nx) nx.disabled = state.currentSection === sections.length - 1;
        if (!storyProgress || sections.length < 2) return;
        const percent = (state.currentSection / (sections.length - 1)) * 100;
        storyProgress.style.height = `${clamp(percent, 0, 100)}%`;
    }

    function setActiveSection(index, instant = false) {
        if (!sections.length) return;

        const nextIndex = clamp(index, 0, sections.length - 1);
        const currentIndex = state.currentSection;

        if (nextIndex === currentIndex && sections[nextIndex].classList.contains("active")) {
            updateStoryProgress();
            return;
        }

        state.currentSection = nextIndex;
        sections[nextIndex].scrollTop = 0;

        sections.forEach((section, i) => {
            section.classList.toggle("active", i === nextIndex);
            section.classList.toggle("visible", i === nextIndex);
            section.classList.remove("leaving");
        });

        updateStoryProgress();
        handleSectionEntered(sections[nextIndex].id);

        if (!instant) {
            document.body.classList.add("section-changing");
            setTimeout(() => document.body.classList.remove("section-changing"), 700);
        }
    }

    function showSection(target, instant = false) {
        let index = -1;

        if (typeof target === "number") {
            index = target;
        } else {
            index = sectionIds.indexOf(target);
        }

        if (index < 0 || index >= sections.length) return;

        if (navigationLocked) return;

        navigationLocked = true;

        const go = () => setActiveSection(index, instant);

        if (instant) {
            go();
            navigationLocked = false;
            return;
        }

        cinematicTransition(go).finally(() => {
            setTimeout(() => {
                navigationLocked = false;
            }, 120);
        });
    }

    function nextSection() {
        if (state.currentSection < sections.length - 1) {
            showSection(state.currentSection + 1);
        }
    }

    function previousSection() {
        if (state.currentSection > 0) {
            showSection(state.currentSection - 1);
        }
    }

    function scrollToSection(id) {
        showSection(id);
    }

    function initSectionNavigation() {
        // Start exactly on hero.
        setActiveSection(0, true);

        /*
         * IMPORTANT:
         * Do NOT hijack the mouse wheel globally.
         * Each story section is now its own scroll container.
         * Long chapters can scroll naturally with a real scrollbar.
         */

        // Touch: scroll normally inside a chapter. Only switch chapters
        // when the user performs a deliberate swipe while the section
        // is already at its top/bottom edge.
        document.addEventListener("touchstart", event => {
            if (!event.touches.length) return;
            touchStartY = event.touches[0].clientY;
            touchStartX = event.touches[0].clientX;
        }, { passive: true });

        document.addEventListener("touchend", event => {
            if (!state.loaderFinished || navigationLocked || !event.changedTouches.length) return;
            if (event.target.closest && event.target.closest("textarea, .puzzle-board, .birthday-cake")) return;

            const endY = event.changedTouches[0].clientY;
            const endX = event.changedTouches[0].clientX;
            const dy = endY - touchStartY;
            const dx = endX - touchStartX;

            if (Math.abs(dy) < 70 || Math.abs(dy) < Math.abs(dx) * 1.25) return;

            const current = sections[state.currentSection];
            if (!current) return;

            const atTop = current.scrollTop <= 3;
            const atBottom = current.scrollTop + current.clientHeight >= current.scrollHeight - 3;

            // Swipe up at the bottom -> next chapter.
            if (dy < 0 && atBottom) {
                nextSection();
            }

            // Swipe down at the top -> previous chapter.
            if (dy > 0 && atTop) {
                previousSection();
            }
        }, { passive: true });

        // Keyboard chapter navigation remains available.
        document.addEventListener("keydown", event => {
            const active = document.activeElement;
            const typing = active &&
                (active.tagName === "TEXTAREA" ||
                 active.tagName === "INPUT" ||
                 active.isContentEditable);

            if (typing) return;

            if (event.key === "ArrowDown" || event.key === "PageDown") {
                const current = sections[state.currentSection];
                if (current && current.scrollTop + current.clientHeight < current.scrollHeight - 3) {
                    return; // Let the browser scroll the current chapter.
                }
                event.preventDefault();
                nextSection();
            }

            if (event.key === "ArrowUp" || event.key === "PageUp") {
                const current = sections[state.currentSection];
                if (current && current.scrollTop > 3) {
                    return; // Let the browser scroll the current chapter.
                }
                event.preventDefault();
                previousSection();
            }

            if (event.key === " ") {
                // Space should scroll normally instead of changing chapters.
                return;
            }

            if (event.key.toLowerCase() === "m") {
                toggleMusic();
            }

            if (event.key === "Home") {
                event.preventDefault();
                showSection(0);
            }

            if (event.key === "End") {
                event.preventDefault();
                showSection(sections.length - 1);
            }
        });
    }

    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimer = null;

    function showToast(message, icon = "♡") {
        if (!toast) return;

        const iconElement =
            byId("toastIcon");

        if (toastText) {
            toastText.textContent = message;
        }

        if (iconElement) {
            iconElement.textContent = icon;
        }

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }


    /* =====================================================
       TRANSITION
    ===================================================== */

    async function cinematicTransition(callback) {
        if (!transitionOverlay) {
            callback?.();
            return;
        }

        transitionOverlay.classList.add("active");

        await sleep(350);

        callback?.();

        await sleep(350);

        transitionOverlay.classList.remove("active");
    }


    /* =====================================================
       LOADER
    ===================================================== */

    const loaderMessages = [
        {
            at: 0,
            text: "Preparing something special...",
            progress: "Gathering memories...",
            icon: "✿",
            quote: "Some people make ordinary days feel a little more special."
        },
        {
            at: 18,
            text: "Finding the right words...",
            progress: "Choosing the little details...",
            icon: "♡",
            quote: "The best gifts are sometimes made, not bought."
        },
        {
            at: 38,
            text: "Adding a few memories...",
            progress: "Arranging tiny moments...",
            icon: "✦",
            quote: "A beautiful life is made of ordinary moments."
        },
        {
            at: 58,
            text: "Writing something from the heart...",
            progress: "Almost there...",
            icon: "✎",
            quote: "Some things are easier to write than to say."
        },
        {
            at: 78,
            text: "Putting everything together...",
            progress: "Making it yours...",
            icon: "✧",
            quote: "Today deserves a little more than a normal wish."
        },
        {
            at: 94,
            text: "One last little touch...",
            progress: "Ready...",
            icon: "♡",
            quote: "This little story was made especially for you."
        }
    ];


    function updateLoaderContent(progress) {
        if (!loaderMessages.length) return;

        let current = loaderMessages[0];

        for (const item of loaderMessages) {
            if (progress >= item.at) {
                current = item;
            }
        }

        if (loaderText) {
            loaderText.textContent =
                current.text;
        }

        if (loaderProgressText) {
            loaderProgressText.textContent =
                current.progress;
        }

        if (loaderStatusIcon) {
            loaderStatusIcon.textContent =
                current.icon;
        }

        if (loaderQuote) {
            loaderQuote.textContent =
                current.quote;
        }
    }


    function setLoaderProgress(progress) {
        const value =
            clamp(Math.round(progress), 0, 100);

        if (loaderPercentage) {
            loaderPercentage.textContent =
                `${value}%`;
        }

        if (loaderProgress) {
            loaderProgress.style.width =
                `${value}%`;
        }

        updateLoaderContent(value);
    }


    async function runLoader() {
        if (!loader) return;

        const startTime = performance.now();

        let lastStage = -1;

        function frame(now) {
            const elapsed =
                now - startTime;

            const raw =
                clamp(
                    elapsed / CONFIG.loaderDuration,
                    0,
                    1
                );

            /*
             * Slightly eased progress so it doesn't
             * feel like a boring linear loading bar.
             */
            const eased =
                1 - Math.pow(1 - raw, 2.2);

            const percentage =
                eased * 100;

            setLoaderProgress(percentage);

            const stage =
                Math.floor(percentage / 18);

            if (stage !== lastStage) {
                lastStage = stage;
            }

            if (raw < 1) {
                requestAnimationFrame(frame);
            } else {
                finishLoader();
            }
        }

        requestAnimationFrame(frame);
    }


    async function finishLoader() {
        if (state.loaderFinished) return;

        state.loaderFinished = true;

        setLoaderProgress(100);

        /* =========================================
        LOADER COMPLETE SCREEN
        ========================================= */

        if (loaderComplete) {
            loaderComplete.classList.add("show");
        }

        await sleep(850);

        /* =========================================
        COMPLETELY DISABLE LOADER
        ========================================= */

        if (loaderComplete) {
            loaderComplete.classList.remove("show");
            loaderComplete.style.pointerEvents = "none";
        }

        if (loader) {
            loader.classList.add("hidden");

            // VERY IMPORTANT
            loader.style.pointerEvents = "none";
            loader.style.visibility = "hidden";
            loader.style.opacity = "0";
        }

        /* =========================================
        START ACTUAL EXPERIENCE
        ========================================= */

        document.documentElement.classList.add("birthday-app");
        document.body.classList.add("experience-ready", "birthday-app");
        navigationLocked = false;

        if (loaderComplete) {
            loaderComplete.classList.remove("show", "active", "visible");
            loaderComplete.style.pointerEvents = "none";
            loaderComplete.style.visibility = "hidden";
            loaderComplete.style.opacity = "0";
            loaderComplete.style.display = "none";
        }

        if (transitionOverlay) {
            transitionOverlay.classList.remove("active", "show", "visible");
            transitionOverlay.style.pointerEvents = "none";
            transitionOverlay.style.visibility = "hidden";
            transitionOverlay.style.opacity = "0";
        }

        const hero = byId("heroSection");

        if (hero) {

            sections.forEach((section, index) => {

                section.classList.toggle(
                    "active",
                    index === 0
                );

                section.classList.toggle(
                    "visible",
                    index === 0
                );

                if (index !== 0) {
                    section.classList.remove(
                        "active",
                        "visible"
                    );
                }

            });

            state.currentSection = 0;

            hero.classList.add(
                "active",
                "visible"
            );

            updateStoryProgress();
        }

        if (experience) {
            experience.scrollTop = 0;
        }

        /* =========================================
        CREATE DECORATIONS
        ========================================= */

        createFloatingParticles();
    }
    /* =====================================================
       FLOATING PARTICLES
    ===================================================== */

    function createFloatingParticles() {
        const container =
            byId("floatingDecor");

        if (!container) return;

        const symbols = [
            "♡",
            "✦",
            "✧",
            "·",
            "✿"
        ];

        for (let i = 0; i < CONFIG.particleCount; i++) {

            const particle =
                document.createElement("span");

            particle.className =
                "float-particle";

            particle.textContent =
                symbols[
                    Math.floor(
                        Math.random() *
                        symbols.length
                    )
                ];

            particle.style.left =
                `${Math.random() * 100}%`;

            particle.style.bottom =
                `${-10 - Math.random() * 30}%`;

            particle.style.fontSize =
                `${10 + Math.random() * 18}px`;

            particle.style.animationDuration =
                `${9 + Math.random() * 13}s`;

            particle.style.animationDelay =
                `${Math.random() * 8}s`;

            particle.style.setProperty(
                "--drift",
                `${-80 + Math.random() * 160}px`
            );

            particle.style.setProperty(
                "--rotate",
                `${-90 + Math.random() * 180}deg`
            );

            container.appendChild(particle);
        }
    }


    /* =====================================================
       SECTION EVENTS
    ===================================================== */

    function handleSectionEntered(id) {
        if (id === "numbersSection") startNumbers(); else stopNumbers();
        if (id === "nightSection") createNightStars();
        if (id === "finalMessageSection") createFinalParticles();

        if (id === "goodbyeSection") {
            showToast("You made it to the end ♡", "✦");
        }
    }

    /* =====================================================
       IMAGE FALLBACK
    ===================================================== */

    function setupImageFallbacks() {

        $$("img").forEach(img => {

            img.addEventListener(
                "error",
                () => {

                    img.style.display =
                        "none";

                    const parent =
                        img.parentElement;

                    if (parent) {
                        parent.classList.add(
                            "image-missing"
                        );

                        if (
                            !parent.querySelector(
                                ".image-placeholder"
                            )
                        ) {

                            const placeholder =
                                document.createElement(
                                    "div"
                                );

                            placeholder.className =
                                "image-placeholder";

                            placeholder.innerHTML = `
                                <span>♡</span>
                                <small>A memory waiting to be added</small>
                            `;

                            placeholder.style.cssText = `
                                position:absolute;
                                inset:0;
                                display:flex;
                                flex-direction:column;
                                align-items:center;
                                justify-content:center;
                                gap:8px;
                                color:#fff8f2;
                                background:
                                    linear-gradient(
                                        135deg,
                                        #b9817f,
                                        #715158
                                    );
                                text-align:center;
                            `;

                            const heart =
                                placeholder.querySelector(
                                    "span"
                                );

                            if (heart) {
                                heart.style.cssText = `
                                    font-family:Caveat,cursive;
                                    font-size:55px;
                                `;
                            }

                            parent.appendChild(
                                placeholder
                            );
                        }
                    }
                },
                {
                    once: true
                }
            );

        });

    }


    /* =====================================================
       MUSIC
    ===================================================== */

    function updateMusicButton() {

        if (!musicToggle) return;

        musicToggle.classList.toggle(
            "playing",
            state.musicPlaying
        );

        musicToggle.textContent =
            state.musicPlaying
                ? "♫"
                : "♪";
    }


    async function toggleMusic() {

        if (!music) return;

        try {

            if (music.paused) {

                await music.play();

                state.musicPlaying = true;

                showToast(
                    "Music on ♫",
                    "♪"
                );

            } else {

                music.pause();

                state.musicPlaying = false;

                showToast(
                    "Music paused",
                    "·"
                );

            }

            updateMusicButton();

        } catch (error) {

            showToast(
                (music.networkState === 3 ? "Music file not found: add assets/music/birthday.mp3" : "Tap again to start the music ♡"),
                "♪"
            );

        }
    }


    if (musicToggle) {
        musicToggle.addEventListener(
            "click",
            toggleMusic
        );
    }


    /* =====================================================
       HERO START
    ===================================================== */

    /* =====================================================
    HERO START — BEGIN BIRTHDAY
    ===================================================== */

    if (startButton) {

        startButton.addEventListener(
            "click",
            async event => {

                event.preventDefault();
                event.stopPropagation();

                console.log(
                    "♡ BEGIN YOUR BIRTHDAY CLICKED ♡"
                );

                /* =========================================
                SAFETY — REMOVE LOADER BLOCK
                ========================================= */

                if (loader) {
                    loader.classList.add("hidden");

                    loader.style.pointerEvents =
                        "none";

                    loader.style.visibility =
                        "hidden";

                    loader.style.opacity =
                        "0";
                    loader.style.display = "none";
                }

                if (loaderComplete) {
                    loaderComplete.classList.remove(
                        "show"
                    );

                    loaderComplete.style.pointerEvents =
                        "none";
                    loaderComplete.style.visibility = "hidden";
                    loaderComplete.style.opacity = "0";
                    loaderComplete.style.display = "none";
                }

                /* =========================================
                REMOVE TRANSITION BLOCK
                ========================================= */

                if (transitionOverlay) {

                    transitionOverlay.classList.remove(
                        "active",
                        "show"
                    );

                    transitionOverlay.style.pointerEvents =
                        "none";
                    transitionOverlay.style.visibility = "hidden";
                    transitionOverlay.style.opacity = "0";
                }

                /* =========================================
                UNLOCK NAVIGATION
                ========================================= */

                navigationLocked = false;
                state.loaderFinished = true;
                document.documentElement.classList.add("birthday-app");
                document.body.classList.add("experience-ready", "birthday-app");
                enforceCinematicLayout();

                /* =========================================
                GO TO INTRO — no extra transition lock
                ========================================= */

                const introIndex = sectionIds.indexOf("introSection");
                if (introIndex >= 0) {
                    setActiveSection(introIndex, false);
                }
                if (experience) experience.scrollTop = 0;

                /* =========================================
                START MUSIC
                ========================================= */

                if (
                    music &&
                    music.paused
                ) {

                    try {

                        await music.play();

                        state.musicPlaying =
                            true;

                        updateMusicButton();

                    } catch (error) {

                        console.log(
                            "Music waiting for user:",
                            error
                        );

                    }

                }

            }
        );

    }
    /* =====================================================
       GENERIC CONTINUE BUTTONS
    ===================================================== */

    /* Navigation matches the chapters that actually exist in index.html. */
    const navigationMap = {
        introContinue: "giftSection",
        giftContinue: "timelineSection",
        timelineContinue: "memoriesSection",
        memoryContinue: "thingsSection",
        thingsContinue: "letterSection",
        letterContinue: "wishSection",
        wishContinue: "puzzleSection",
        puzzleContinue: "nightSection",
        nightContinue: "finalMessageSection",
        finalContinue: "goodbyeSection"
    };

    Object.entries(navigationMap).forEach(([buttonId, targetId]) => {
        const button = byId(buttonId);
        if (!button) return;

        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            showSection(targetId);
        });
    });

    /* =====================================================
       GIFT
    ===================================================== */

    function openGift() {

        if (!giftBox) return;

        if (state.giftOpened) return;

        state.giftOpened = true;

        giftBox.classList.add("open");

        if (giftHint) {
            giftHint.innerHTML =
                "something special is waiting <span>♡</span>";
        }

        setTimeout(() => {

            if (giftReveal) {
                giftReveal.classList.add("show");
            }
            const gc = byId("giftContinue");
            if (gc) gc.classList.add("show");
            confettiBurst(innerWidth / 2, innerHeight * 0.55, 30);

            showToast(
                "The real gift is the story ♡",
                "♡"
            );

        }, 650);

    }


    if (giftBox) {
        giftBox.addEventListener(
            "click",
            openGift
        );
    }


    /* =====================================================
       WISH OPTIONS
    ===================================================== */

    const wishMessages = {

        happiness:
            "May happiness find you even on ordinary days.",

        dreams:
            "May you have the courage to chase every dream.",

        peace:
            "May your life have more quiet, beautiful moments.",

        adventure:
            "May this year give you stories worth remembering."

    };


    $$(".wish-option").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const wish =
                    button.dataset.wish;

                if (!wish) return;

                state.selectedWish =
                    wish;

                $$(".wish-option").forEach(
                    option => {
                        option.classList.remove(
                            "selected"
                        );
                    }
                );

                button.classList.add(
                    "selected"
                );

                if (wishResultText) {
                    wishResultText.textContent =
                        wishMessages[wish] ||
                        "Something beautiful is growing.";
                }

                if (wishResult) {
                    wishResult.classList.add(
                        "show"
                    );
                }

                showToast(
                    "Wish planted ♡",
                    "✿"
                );

            }
        );

    });


    /* =====================================================
       PUZZLE — 3x3, tap two pieces to swap.
       Every piece is visible, so it is always solvable.
    ===================================================== */

    const puzzleGoal = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    (() => {
        const probe = new Image();
        probe.onerror = () => { if (puzzleBoard) puzzleBoard.classList.add("no-img"); };
        probe.src = "assets/images/secret-memory.jpg";
    })();

    function isPuzzleSolved() {
        return state.puzzleTiles.every((v, i) => v === puzzleGoal[i]);
    }

    function generatePuzzle() {
        const t = [...puzzleGoal];
        do {
            for (let i = t.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [t[i], t[j]] = [t[j], t[i]];
            }
        } while (t.every((v, i) => v === i));
        state.puzzleTiles = t;
    }

    function renderPuzzle() {
        if (!puzzleBoard) return;
        puzzleBoard.innerHTML = "";
        state.puzzleTiles.forEach((tile, position) => {
            const piece = document.createElement("button");
            piece.type = "button";
            piece.className = "puzzle-piece" + (state.puzzleSelected === position ? " selected" : "");
            piece.setAttribute("aria-label", `Puzzle piece ${tile + 1}`);
            piece.style.backgroundImage = "url('assets/images/secret-memory.jpg')";
            piece.style.backgroundPosition = `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%`;
            piece.innerHTML = `<i>${tile + 1}</i>`;
            piece.addEventListener("click", () => handlePuzzlePieceClick(position));
            puzzleBoard.appendChild(piece);
        });
        updatePuzzleMoves();
    }

    function updatePuzzleMoves() {
        if (puzzleMoves) puzzleMoves.textContent = `${state.puzzleMoves} ${state.puzzleMoves === 1 ? "move" : "moves"}`;
    }

    function swapPuzzleTiles(a, b) {
        [state.puzzleTiles[a], state.puzzleTiles[b]] = [state.puzzleTiles[b], state.puzzleTiles[a]];
    }

    function handlePuzzlePieceClick(position) {
        if (state.puzzleSolved) return;
        if (state.puzzleSelected === null) {
            state.puzzleSelected = position;
        } else if (state.puzzleSelected === position) {
            state.puzzleSelected = null;
        } else {
            swapPuzzleTiles(state.puzzleSelected, position);
            state.puzzleMoves++;
            state.puzzleSelected = null;
            if (puzzleFeedback) puzzleFeedback.textContent = "";
        }
        renderPuzzle();
        if (isPuzzleSolved()) solvePuzzle();
    }

    function startPuzzle() {
        if (!state.puzzleStarted) {
            state.puzzleStarted = true;
            state.puzzleSolved = false;
            state.puzzleMoves = 0;
            state.puzzleSelected = null;
            generatePuzzle();
            renderPuzzle();
        }
        if (puzzleIntro) puzzleIntro.classList.remove("active");
        if (puzzleReveal) puzzleReveal.classList.remove("active");
        if (puzzleGame) puzzleGame.classList.add("active");

        // The puzzle lives lower inside the same scrollable chapter.
        // Bring it into view automatically instead of making the user
        // manually scroll after pressing “Begin The Secret”.
        const puzzleSection = byId("puzzleSection");
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!puzzleSection || !puzzleGame) return;
                const top = Math.max(0, puzzleGame.offsetTop - 28);
                puzzleSection.scrollTo({ top, behavior: "smooth" });
            });
        });
    }

    function shufflePuzzle() {
        if (state.puzzleSolved) return;
        state.puzzleMoves = 0;
        state.puzzleSelected = null;
        generatePuzzle();
        if (puzzleFeedback) puzzleFeedback.textContent = "Shuffled. Try again ✦";
        renderPuzzle();
    }

    function givePuzzleHint() {
        if (state.puzzleSolved) return;
        const wrong = state.puzzleTiles.findIndex((t, i) => t !== puzzleGoal[i]);
        if (wrong === -1) return;
        swapPuzzleTiles(wrong, state.puzzleTiles.indexOf(puzzleGoal[wrong]));
        state.puzzleMoves++;
        state.puzzleSelected = null;
        if (puzzleFeedback) puzzleFeedback.textContent = "A little hint... one piece moved closer ♡";
        renderPuzzle();
        if (isPuzzleSolved()) solvePuzzle();
    }

    function solvePuzzle() {
        state.puzzleSolved = true;
        if (puzzleFeedback) puzzleFeedback.textContent = "You found the secret! ♡";
        confettiBurst(innerWidth / 2, innerHeight / 2, 30);
        setTimeout(() => {
            if (puzzleGame) puzzleGame.classList.remove("active");
            if (puzzleReveal) puzzleReveal.classList.add("active");
            showToast("Secret unlocked ♡", "✦");
        }, 900);
    }

    if (startPuzzleButton) startPuzzleButton.addEventListener("click", startPuzzle);
    if (puzzleShuffle) puzzleShuffle.addEventListener("click", shufflePuzzle);
    if (puzzleHint) puzzleHint.addEventListener("click", givePuzzleHint);

    /* =====================================================
       PERSONAL WISH
    ===================================================== */

    function updateWishCount() {

        if (!personalWish) return;

        const length =
            personalWish.value.length;

        if (wishCharacterCount) {
            wishCharacterCount.textContent =
                length;
        }

    }


    if (personalWish) {

        personalWish.addEventListener(
            "input",
            updateWishCount
        );

    }


    if (saveWishButton) {

        saveWishButton.addEventListener(
            "click",
            () => {

                if (!personalWish) return;

                const value =
                    personalWish.value.trim();

                if (!value) {

                    showToast(
                        "Write your wish first ♡",
                        "✎"
                    );

                    personalWish.focus();

                    return;
                }


                state.personalWish =
                    value.slice(
                        0,
                        CONFIG.maxWishLength
                    );


                try {

                    localStorage.setItem(
                        "didiBirthdayWish",
                        state.personalWish
                    );

                } catch {
                    // localStorage may be blocked.
                }


                if (savedWish) {
                    savedWish.classList.add(
                        "show"
                    );
                }


                showToast(
                    "Your wish is safely tucked away ♡",
                    "✦"
                );

            }
        );

    }


    function loadSavedWish() {

        if (!personalWish) return;

        try {

            const saved =
                localStorage.getItem(
                    "didiBirthdayWish"
                );

            if (saved) {

                personalWish.value =
                    saved.slice(
                        0,
                        CONFIG.maxWishLength
                    );

                state.personalWish =
                    personalWish.value;

                updateWishCount();

            }

        } catch {
            // Ignore storage errors.
        }

    }


    /* =====================================================
       CAKE — PRESS AND HOLD
    ===================================================== */

    function startCakePress(event) {

        if (
            state.cakeBlown ||
            !birthdayCake
        ) return;

        /*
         * Prevent scrolling weirdness on touch.
         */
        if (
            event &&
            event.type === "touchstart"
        ) {
            event.preventDefault();
        }

        state.cakePressStart =
            performance.now();

        cakeHint.textContent =
            "Keep holding... ✦";

        birthdayCake.classList.add(
            "holding"
        );

        clearTimeout(
            state.cakePressTimer
        );

        state.cakePressTimer =
            setTimeout(
                blowOutCake,
                1100
            );

    }


    function cancelCakePress() {

        if (
            state.cakeBlown
        ) return;

        clearTimeout(
            state.cakePressTimer
        );

        if (birthdayCake) {
            birthdayCake.classList.remove(
                "holding"
            );
        }

        if (cakeHint) {
            cakeHint.textContent =
                "Press and hold the candle";
        }

    }


    function blowOutCake() {

        if (state.cakeBlown) return;

        state.cakeBlown = true;

        clearTimeout(
            state.cakePressTimer
        );

        if (birthdayCake) {
            birthdayCake.classList.add(
                "blown"
            );
        }

        if (cakeFlame) {
            cakeFlame.style.opacity = "0";
        }

        if (cakeHint) {
            cakeHint.textContent =
                "Wish made. ♡";
        }

        if (cakeWishMessage) {
            cakeWishMessage.classList.add(
                "show"
            );
        }

        showToast(
            "Wish made ♡",
            "✦"
        );

        createCakeParticles();

    }


    if (birthdayCake) {

        birthdayCake.addEventListener(
            "mousedown",
            startCakePress
        );

        birthdayCake.addEventListener(
            "mouseup",
            cancelCakePress
        );

        birthdayCake.addEventListener(
            "mouseleave",
            cancelCakePress
        );

        birthdayCake.addEventListener(
            "touchstart",
            startCakePress,
            {
                passive: false
            }
        );

        birthdayCake.addEventListener(
            "touchend",
            cancelCakePress
        );

        birthdayCake.addEventListener(
            "touchcancel",
            cancelCakePress
        );


        birthdayCake.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();
                    if (!event.repeat) startCakePress(event);

                }

            }
        );


        birthdayCake.addEventListener(
            "keyup",
            event => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    cancelCakePress();

                }

            }
        );

    }


    /* =====================================================
       CAKE PARTICLES
    ===================================================== */

    function createCakeParticles() {

        const cc = byId("cakeContinue");
        if (cc) cc.classList.add("show");
        confettiBurst(innerWidth / 2, innerHeight * 0.5, 34);

        if (!birthdayCake) return;

        const symbols = [
            "✦",
            "✧",
            "♡",
            "·"
        ];

        for (let i = 0; i < 16; i++) {

            const particle =
                document.createElement("span");

            particle.textContent =
                symbols[
                    Math.floor(
                        Math.random() *
                        symbols.length
                    )
                ];

            particle.style.position =
                "absolute";

            particle.style.left =
                "50%";

            particle.style.bottom =
                "50%";

            particle.style.color =
                "#b97878";

            particle.style.fontFamily =
                "Caveat, cursive";

            particle.style.fontSize =
                `${14 + Math.random() * 18}px`;

            particle.style.pointerEvents =
                "none";

            birthdayCake.appendChild(
                particle
            );

            const angle =
                Math.random() * Math.PI * 2;

            const distance =
                70 + Math.random() * 130;

            const x =
                Math.cos(angle) * distance;

            const y =
                Math.sin(angle) * distance;

            particle.animate(
                [
                    {
                        transform:
                            "translate(-50%, 0) scale(.5)",
                        opacity: 0
                    },
                    {
                        transform:
                            "translate(-50%, 0) scale(1)",
                        opacity: 1,
                        offset: .2
                    },
                    {
                        transform:
                            `translate(
                                calc(-50% + ${x}px),
                                ${y}px
                            )
                            scale(.7)`,
                        opacity: 0
                    }
                ],
                {
                    duration:
                        1000 +
                        Math.random() * 700,

                    easing:
                        "cubic-bezier(.2,.7,.3,1)"
                }
            ).finished
                .then(() => {
                    particle.remove();
                })
                .catch(() => {
                    particle.remove();
                });

        }

    }


    /* =====================================================
       NIGHT SKY
    ===================================================== */

    let nightStarsCreated = false;

    function createNightStars() {

        if (
            nightStarsCreated ||
            !nightStars
        ) return;

        nightStarsCreated = true;

        const count =
            window.innerWidth < 600
                ? 55
                : 90;

        for (let i = 0; i < count; i++) {

            const star =
                document.createElement("span");

            star.className =
                "night-star";

            star.style.left =
                `${Math.random() * 100}%`;

            star.style.top =
                `${Math.random() * 100}%`;

            const size =
                1 + Math.random() * 2.5;

            star.style.width =
                `${size}px`;

            star.style.height =
                `${size}px`;

            star.style.animationDelay =
                `${Math.random() * 3}s`;

            star.style.animationDuration =
                `${1.7 + Math.random() * 3}s`;

            nightStars.appendChild(
                star
            );

        }

    }


    /* =====================================================
       FINAL PARTICLES
    ===================================================== */

    let finalParticlesCreated = false;

    function createFinalParticles() {

        if (
            finalParticlesCreated ||
            !finalParticles
        ) return;

        finalParticlesCreated = true;

        const symbols = [
            "♡",
            "✦",
            "✧",
            "·"
        ];

        for (let i = 0; i < 20; i++) {

            const particle =
                document.createElement("span");

            particle.className =
                "final-particle";

            particle.textContent =
                symbols[
                    Math.floor(
                        Math.random() *
                        symbols.length
                    )
                ];

            particle.style.left =
                `${Math.random() * 100}%`;

            particle.style.top =
                `${Math.random() * 100}%`;

            particle.style.fontSize =
                `${12 + Math.random() * 25}px`;

            particle.style.animationDelay =
                `${Math.random() * 4}s`;

            particle.style.animationDuration =
                `${5 + Math.random() * 5}s`;

            finalParticles.appendChild(
                particle
            );

        }

    }


    /* =====================================================
       CERTIFICATE DOWNLOAD
       Creates certificate directly with Canvas.
       No certificate.png dependency.
    ===================================================== */

    function roundedRect(
        ctx,
        x,
        y,
        width,
        height,
        radius
    ) {

        const r =
            Math.min(
                radius,
                width / 2,
                height / 2
            );

        ctx.beginPath();

        ctx.moveTo(
            x + r,
            y
        );

        ctx.arcTo(
            x + width,
            y,
            x + width,
            y + height,
            r
        );

        ctx.arcTo(
            x + width,
            y + height,
            x,
            y + height,
            r
        );

        ctx.arcTo(
            x,
            y + height,
            x,
            y,
            r
        );

        ctx.arcTo(
            x,
            y,
            x + width,
            y,
            r
        );

        ctx.closePath();

    }


    function downloadBirthdayCertificate() {

        const canvas =
            document.createElement("canvas");

        canvas.width = 1800;
        canvas.height = 1273;

        const ctx =
            canvas.getContext("2d");

        if (!ctx) return;


        /*
         * Background
         */
        const gradient =
            ctx.createLinearGradient(
                0,
                0,
                1800,
                1273
            );

        gradient.addColorStop(
            0,
            "#fffaf4"
        );

        gradient.addColorStop(
            1,
            "#f1dfd4"
        );

        ctx.fillStyle =
            gradient;

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        /*
         * Gold outer border
         */
        ctx.strokeStyle =
            "#b79862";

        ctx.lineWidth = 24;

        ctx.strokeRect(
            28,
            28,
            1744,
            1217
        );


        /*
         * Inner border
         */
        ctx.strokeStyle =
            "rgba(183,152,98,.45)";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            55,
            55,
            1690,
            1163
        );


        /*
         * Header
         */
        ctx.fillStyle =
            "#8d7b73";

        ctx.font =
            "500 24px 'DM Sans', Arial, sans-serif";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "OFFICIAL BIRTHDAY CERTIFICATE",
            900,
            145
        );


        ctx.font =
            "500 20px 'DM Sans', Arial, sans-serif";

        ctx.fillStyle =
            "#b79862";

        ctx.fillText(
            "EST. 2008     •     EDITION 2026",
            900,
            185
        );


        /*
         * Symbol
         */
        ctx.fillStyle =
            "#b79862";

        ctx.font =
            "70px 'Cormorant Garamond', Georgia, serif";

        ctx.fillText(
            "✦",
            900,
            285
        );


        /*
         * Label
         */
        ctx.fillStyle =
            "#8d7b73";

        ctx.font =
            "500 19px 'DM Sans', Arial, sans-serif";

        ctx.fillText(
            "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
            900,
            345
        );


        /*
         * Didi
         */
        ctx.fillStyle =
            "#613d45";

        ctx.font =
            "bold 100px 'Cormorant Garamond', Georgia, serif";

        ctx.fillText(
            "Didi",
            900,
            455
        );


        ctx.strokeStyle =
            "#b79862";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            720,
            485
        );

        ctx.lineTo(
            1080,
            485
        );

        ctx.stroke();


        /*
         * Main text
         */
        ctx.fillStyle =
            "#604b43";

        ctx.font =
            "26px 'Cormorant Garamond', Georgia, serif";

        const lines = [
            "For successfully completing another beautiful year",
            "of life while remaining wonderfully, unapologetically herself."
        ];

        lines.forEach(
            (line, index) => {

                ctx.fillText(
                    line,
                    900,
                    555 +
                    index * 40
                );

            }
        );


        /*
         * Achievement cards
         */
        const achievements = [
            ["01", "Kind heart"],
            ["02", "Beautiful soul"],
            ["03", "Professional sister"],
            ["04", "Certified awesome"]
        ];

        const startX = 180;
        const boxWidth = 300;
        const gap = 80;

        achievements.forEach(
            (item, index) => {

                const x =
                    startX +
                    index *
                    (boxWidth + gap);

                roundedRect(
                    ctx,
                    x,
                    690,
                    boxWidth,
                    105,
                    16
                );

                ctx.fillStyle =
                    "rgba(183,152,98,.08)";

                ctx.fill();

                ctx.fillStyle =
                    "#b79862";

                ctx.font =
                    "bold 24px 'Cormorant Garamond', Georgia, serif";

                ctx.fillText(
                    item[0],
                    x + boxWidth / 2,
                    730
                );

                ctx.fillStyle =
                    "#604b43";

                ctx.font =
                    "19px 'DM Sans', Arial, sans-serif";

                ctx.fillText(
                    item[1],
                    x + boxWidth / 2,
                    766
                );

            }
        );


        /*
         * Bottom divider
         */
        ctx.strokeStyle =
            "rgba(126,78,85,.18)";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            230,
            875
        );

        ctx.lineTo(
            1570,
            875
        );

        ctx.stroke();


        /*
         * Footer
         */
        ctx.textAlign =
            "left";

        ctx.fillStyle =
            "#8d7b73";

        ctx.font =
            "15px 'DM Sans', Arial, sans-serif";

        ctx.fillText(
            "DATE",
            230,
            940
        );

        ctx.fillStyle =
            "#613d45";

        ctx.font =
            "bold 22px 'Cormorant Garamond', Georgia, serif";

        ctx.fillText(
            "07 · 11 · 2026",
            230,
            975
        );


        /*
         * Seal
         */
        ctx.beginPath();

        ctx.arc(
            900,
            970,
            55,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "#b79862";

        ctx.lineWidth = 3;

        ctx.stroke();

        ctx.fillStyle =
            "#b79862";

        ctx.font =
            "45px 'Cormorant Garamond', Georgia, serif";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "♡",
            900,
            986
        );


        /*
         * Issued by
         */
        ctx.textAlign =
            "right";

        ctx.fillStyle =
            "#8d7b73";

        ctx.font =
            "15px 'DM Sans', Arial, sans-serif";

        ctx.fillText(
            "ISSUED BY",
            1570,
            940
        );

        ctx.fillStyle =
            "#613d45";

        ctx.font =
            "bold 25px 'Cormorant Garamond', Georgia, serif";

        ctx.fillText(
            "Your Little Brother",
            1570,
            975
        );


        /*
         * Bottom line
         */
        ctx.textAlign =
            "center";

        ctx.fillStyle =
            "#b79862";

        ctx.font =
            "italic 24px 'Cormorant Garamond', Georgia, serif";

        ctx.fillText(
            "Made especially for you ♡",
            900,
            1115
        );


        /*
         * Download
         */
        const link =
            document.createElement("a");

        link.download =
            "Didi-Birthday-Certificate-2026.png";

        link.href =
            canvas.toDataURL(
                "image/png"
            );

        document.body.appendChild(link);

        link.click();

        link.remove();


        showToast(
            "Certificate downloaded ♡",
            "✦"
        );

    }


    if (downloadCertificate) {

        downloadCertificate.addEventListener("click", async () => {
            try {
                await document.fonts.load("bold 100px 'Cormorant Garamond'");
                await document.fonts.load("19px 'DM Sans'");
            } catch {}
            downloadBirthdayCertificate();
        });

    }


    /* =====================================================
       RESTART
    ===================================================== */

    if (restartButton) {
        restartButton.addEventListener("click", event => {
            event.preventDefault();

            Object.assign(state, {
                giftOpened: false, selectedWish: null, puzzleStarted: false,
                puzzleSolved: false, puzzleMoves: 0, puzzleSelected: null, cakeBlown: false
            });

            if (giftBox) giftBox.classList.remove("open");
            if (giftReveal) giftReveal.classList.remove("show");
            if (giftHint) giftHint.innerHTML = "tap the gift <span>✦</span>";

            $$(".gated").forEach(el => el.classList.remove("show"));
            $$(".wish-option, .envelope").forEach(o => o.classList.remove("selected"));
            if (wishResult) wishResult.classList.remove("show");
            if (savedWish) savedWish.classList.remove("show");
            const note = byId("openNote");
            if (note) note.classList.remove("show");

            if (birthdayCake) birthdayCake.classList.remove("holding", "blown");
            if (cakeFlame) cakeFlame.style.opacity = "";
            if (cakeHint) cakeHint.textContent = "Press and hold the candle";
            if (cakeWishMessage) cakeWishMessage.classList.remove("show");

            if (puzzleIntro) puzzleIntro.classList.add("active");
            if (puzzleGame) puzzleGame.classList.remove("active");
            if (puzzleReveal) puzzleReveal.classList.remove("active");
            if (puzzleFeedback) puzzleFeedback.textContent = "";
            if (puzzleBoard) puzzleBoard.innerHTML = "";
            updatePuzzleMoves();

            showSection(0);
            showToast("Starting the story again ♡", "↻");
        });
    }

    /* =====================================================
       RESIZE
    ===================================================== */

    let resizeTimer = null;

    window.addEventListener(
        "resize",
        () => {

            clearTimeout(resizeTimer);

            resizeTimer =
                setTimeout(() => {

                    /*
                     * Recalculate stars only when
                     * night hasn't been created yet.
                     */
                    if (
                        nightStars &&
                        !nightStarsCreated
                    ) {
                        // Nothing required.
                    }

                }, 150);

        }
    );


    /* =====================================================
       VISIBILITY CHANGE — pause in background, resume after
    ===================================================== */

    let musicWasPlaying = false;

    document.addEventListener("visibilitychange", () => {
        if (!music) return;
        if (document.hidden && !music.paused) {
            musicWasPlaying = true;
            music.pause();
            state.musicPlaying = false;
            updateMusicButton();
        } else if (!document.hidden && musicWasPlaying) {
            musicWasPlaying = false;
            music.play().then(() => {
                state.musicPlaying = true;
                updateMusicButton();
            }).catch(() => {});
        }
    });

    /* =====================================================
       CINEMATIC LAYOUT SAFETY NET
       Keeps the story as one page at a time even if an older
       .story-section rule exists in style.css.
    ===================================================== */

    function enforceCinematicLayout() {
        let style = document.getElementById("birthday-cinematic-runtime");
        if (!style) {
            style = document.createElement("style");
            style.id = "birthday-cinematic-runtime";
            document.head.appendChild(style);
        }
        style.textContent = `
            html.birthday-app,
            body.birthday-app {
                height: 100%;
                overflow: hidden !important;
            }

            body.birthday-app #experience {
                position: fixed !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100dvh !important;
                min-height: 100dvh !important;
                overflow: hidden !important;
            }

            body.birthday-app #experience > .story-section {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                min-height: 100% !important;
                max-height: 100% !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                transform: translate3d(0, 24px, 0) scale(.985) !important;
                z-index: 0 !important;
                transition:
                    opacity .55s ease,
                    transform .7s cubic-bezier(.22,.61,.36,1),
                    visibility 0s linear .7s !important;
            }

            body.birthday-app #experience > .story-section.active,
            body.birthday-app #experience > .story-section.visible {
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                transform: translate3d(0, 0, 0) scale(1) !important;
                z-index: 5 !important;
                transition:
                    opacity .55s ease,
                    transform .7s cubic-bezier(.22,.61,.36,1),
                    visibility 0s linear 0s !important;
            }

            body.birthday-app #loader.hidden {
                pointer-events: none !important;
            }

            body.birthday-app .story-section {
                scrollbar-width: thin !important;
                scrollbar-color: rgba(126, 78, 85, .30) transparent !important;
                overscroll-behavior-y: contain !important;
                -webkit-overflow-scrolling: touch !important;
            }

            body.birthday-app .story-section::-webkit-scrollbar {
                width: 7px !important;
                height: 7px !important;
            }

            body.birthday-app .story-section::-webkit-scrollbar-track {
                background: transparent !important;
            }

            body.birthday-app .story-section::-webkit-scrollbar-thumb {
                background: rgba(126, 78, 85, .30) !important;
                border-radius: 999px !important;
            }

            @media (max-width: 700px) {
                body.birthday-app #experience > .story-section {
                    height: 100svh !important;
                    min-height: 100svh !important;
                }
            }
        `;
    }

    /* =====================================================
       EXTRAS — confetti, countdown, notes, wheel, dock
    ===================================================== */

    function confettiBurst(x = innerWidth / 2, y = innerHeight / 2, n = 26) {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const host = byId("floatingDecor") || document.body;
        const symbols = ["♡", "✦", "✧", "✿", "·"];
        const colors = ["#b97878", "#b79862", "#7e4e55", "#d9a7a4"];
        for (let i = 0; i < n; i++) {
            const el = document.createElement("span");
            el.textContent = symbols[i % symbols.length];
            el.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-family:Caveat,cursive;` +
                `font-size:${14 + Math.random() * 20}px;color:${colors[i % colors.length]};pointer-events:none`;
            host.appendChild(el);
            const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 170;
            el.animate([
                { transform: "translate(-50%,-50%) scale(.4)", opacity: 1 },
                { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 60}px)) rotate(${Math.random() * 360}deg) scale(1)`, opacity: 0 }
            ], { duration: 1100 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.3,1)" })
                .finished.then(() => el.remove()).catch(() => el.remove());
        }
    }

    let numbersTimer = null;

    function renderNumbers() {
        const now = new Date();
        const born = new Date(2008, 10, 7);
        const days = Math.floor((now - born) / 864e5);
        const isToday = now.getMonth() === 10 && now.getDate() === 7;
        let years = now.getFullYear() - 2008;
        if (now < new Date(now.getFullYear(), 10, 7)) years--;

        const set = (id, v) => { const el = byId(id); if (el) el.textContent = v; };
        set("numYears", years);
        set("numDays", days.toLocaleString("en-IN"));
        set("numHours", (days * 24).toLocaleString("en-IN"));
        set("numBeats", "≈ " + Math.round(days * 100800 / 1e6) + "M");

        const label = byId("cdLabel"), row = byId("cdRow");
        if (!label || !row) return;
        if (isToday) {
            label.textContent = "It's today. Happy Birthday, Didi ♡";
            row.style.display = "none";
            return;
        }
        row.style.display = "";
        let next = new Date(now.getFullYear(), 10, 7);
        if (now > next) next = new Date(now.getFullYear() + 1, 10, 7);
        const t = Math.max(0, Math.floor((next - now) / 1000));
        const pad = v => String(v).padStart(2, "0");
        label.textContent = `until you turn ${years + 1}`;
        set("cdD", Math.floor(t / 86400));
        set("cdH", pad(Math.floor(t % 86400 / 3600)));
        set("cdM", pad(Math.floor(t % 3600 / 60)));
        set("cdS", pad(t % 60));
    }

    function startNumbers() {
        renderNumbers();
        clearInterval(numbersTimer);
        numbersTimer = setInterval(renderNumbers, 1000);
    }

    function stopNumbers() {
        clearInterval(numbersTimer);
        numbersTimer = null;
    }

    function initExtras() {
        const prev = byId("navPrev"), next = byId("navNext");
        if (prev) prev.addEventListener("click", previousSection);
        if (next) next.addEventListener("click", nextSection);

        // Open-when envelopes
        const notes = {
            sad: "Hey. Bad days are allowed. Drink some water, call me, and remember: you've survived 100% of your bad days so far. Great record.",
            happy: "Good. Keep it. Tell me everything, with the dramatic pauses. I want the full story.",
            sleep: "Put the phone down. Okay, one more song. Then sleep. Tomorrow-you needs you.",
            miss: "Annoying, right? Same. Text me. I'll pretend I was busy and then reply instantly."
        };
        $$(".envelope").forEach(btn => btn.addEventListener("click", () => {
            $$(".envelope").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            const note = byId("openNote");
            if (note) { note.textContent = notes[btn.dataset.note] || ""; note.classList.add("show"); }
        }));

        // Tiny hearts wherever she taps
        let lastTap = 0;
        document.addEventListener("pointerdown", e => {
            if (!state.loaderFinished || Date.now() - lastTap < 250) return;
            if (e.target.closest && e.target.closest("button, textarea, a, [role=button]")) return;
            lastTap = Date.now();
            confettiBurst(e.clientX, e.clientY, 5);
        }, { passive: true });
    }

    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function init() {
        setupImageFallbacks();
        loadSavedWish();
        updateWishCount();

        // Prepare cinematic rules. The birthday-app class is activated
        // only after the loader is finished so the loader cannot sit on
        // top of or interfere with the Begin button.
        enforceCinematicLayout();

        if (experience) {
            experience.scrollTop = 0;
        }

        // Make sure the hero is the only active page before loader ends.
        sections.forEach((section, index) => {
            section.classList.toggle("active", index === 0);
            section.classList.toggle("visible", index === 0);
        });

        state.currentSection = 0;
        updateStoryProgress();

        initSectionNavigation();
        initExtras();

        runLoader();
    }

    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    } else {

        init();

    }

})();

/* =========================================================
   BIRTHDAY COUNTDOWN
   FLOW:
   LOADER → COUNTDOWN → BIRTHDAY EXPERIENCE
========================================================= */

(function () {
    "use strict";

    function initBirthdayCountdown() {

        const countdownSection =
            document.getElementById("countdownSection");

        const experience =
            document.getElementById("experience");

        const daysEl =
            document.getElementById("countdownDays");

        const hoursEl =
            document.getElementById("countdownHours");

        const minutesEl =
            document.getElementById("countdownMinutes");

        const secondsEl =
            document.getElementById("countdownSeconds");

        const countdownMessage =
            document.getElementById("countdownMessage");

        const countdownTransition =
            document.getElementById("countdownTransition");

        const countdownTransitionText =
            document.getElementById("countdownTransitionText");


        /* -----------------------------------------------------
           CHECK ELEMENTS
        ----------------------------------------------------- */

        if (!countdownSection) {
            console.warn(
                "Birthday Countdown: #countdownSection not found."
            );
            return;
        }


        /* -----------------------------------------------------
           BIRTHDAY DATE
           07 NOVEMBER 2026 — INDIA
        ----------------------------------------------------- */

        const birthdayTime =
            new Date("2026-11-07T00:00:00+05:30").getTime();


        let countdownInterval = null;
        let countdownFinished = false;
        let transitionStarted = false;


        /* -----------------------------------------------------
           FORMAT
        ----------------------------------------------------- */

        function pad(number) {
            return String(number).padStart(2, "0");
        }


        /* -----------------------------------------------------
           UPDATE NUMBER
        ----------------------------------------------------- */

        function updateNumber(element, value) {

            if (!element) return;

            const newValue = pad(value);

            if (element.textContent !== newValue) {

                element.classList.remove(
                    "countdown-number-changing"
                );

                void element.offsetWidth;

                element.textContent = newValue;

                element.classList.add(
                    "countdown-number-changing"
                );
            }
        }


        /* -----------------------------------------------------
           UPDATE COUNTDOWN
        ----------------------------------------------------- */

        function updateCountdown() {

            if (countdownFinished) return;

            const now = Date.now();

            const difference =
                birthdayTime - now;


            /* ---------------------------------------------
               TIME FINISHED
            --------------------------------------------- */

            if (difference <= 0) {

                updateNumber(daysEl, 0);
                updateNumber(hoursEl, 0);
                updateNumber(minutesEl, 0);
                updateNumber(secondsEl, 0);

                finishCountdown();

                return;
            }


            /* ---------------------------------------------
               CALCULATE
            --------------------------------------------- */

            const totalSeconds =
                Math.floor(difference / 1000);

            const days =
                Math.floor(totalSeconds / 86400);

            const hours =
                Math.floor(
                    (totalSeconds % 86400) / 3600
                );

            const minutes =
                Math.floor(
                    (totalSeconds % 3600) / 60
                );

            const seconds =
                totalSeconds % 60;


            /* ---------------------------------------------
               DISPLAY
            --------------------------------------------- */

            updateNumber(daysEl, days);
            updateNumber(hoursEl, hours);
            updateNumber(minutesEl, minutes);
            updateNumber(secondsEl, seconds);
        }


        /* -----------------------------------------------------
           COUNTDOWN FINISHED
        ----------------------------------------------------- */

        function finishCountdown() {

            if (countdownFinished) return;

            countdownFinished = true;


            if (countdownInterval) {

                clearInterval(
                    countdownInterval
                );

                countdownInterval = null;
            }


            if (countdownMessage) {

                countdownMessage.textContent =
                    "The wait is over... ♡";
            }


            setTimeout(function () {

                startBirthdayTransition();

            }, 1200);
        }


        /* -----------------------------------------------------
           CINEMATIC TRANSITION
        ----------------------------------------------------- */

        function startBirthdayTransition() {

            if (transitionStarted) return;

            transitionStarted = true;


            if (countdownTransition) {

                countdownTransition.classList.add(
                    "active"
                );
            }


            if (countdownTransitionText) {

                countdownTransitionText.textContent =
                    "It's time... ♡";
            }


            const content =
                countdownSection.querySelector(
                    ".countdown-content"
                );


            if (content) {

                content.style.transition =
                    "opacity .8s ease, transform 1s cubic-bezier(.22,1,.36,1)";

                content.style.opacity = "0";

                content.style.transform =
                    "scale(.94) translateY(-20px)";
            }


            setTimeout(function () {

                openBirthdayExperience();

            }, 2200);
        }


        /* -----------------------------------------------------
           OPEN BIRTHDAY EXPERIENCE
        ----------------------------------------------------- */

        function openBirthdayExperience() {

            if (!experience) {

                console.warn(
                    "Birthday Countdown: #experience not found."
                );

                return;
            }


            /* ---------------------------------------------
               PREPARE EXPERIENCE
            --------------------------------------------- */

            experience.classList.add("active");

            experience.style.visibility = "visible";
            experience.style.pointerEvents = "auto";
            experience.style.display = "";
            experience.style.opacity = "0";
            experience.style.transform = "scale(1.035)";


            /* ---------------------------------------------
               FADE IN EXPERIENCE
            --------------------------------------------- */

            requestAnimationFrame(function () {

                requestAnimationFrame(function () {

                    experience.style.transition =
                        "opacity 1.5s cubic-bezier(.22,1,.36,1), " +
                        "transform 1.5s cubic-bezier(.22,1,.36,1)";

                    experience.style.opacity = "1";

                    experience.style.transform =
                        "scale(1)";
                });
            });


            /* ---------------------------------------------
               FADE OUT COUNTDOWN
            --------------------------------------------- */

            countdownSection.style.transition =
                "opacity 1.3s ease, " +
                "transform 1.5s cubic-bezier(.22,1,.36,1)";

            countdownSection.style.opacity = "0";

            countdownSection.style.transform =
                "scale(1.08)";


            countdownSection.style.pointerEvents =
                "none";


            /* ---------------------------------------------
               REMOVE COUNTDOWN
            --------------------------------------------- */

            setTimeout(function () {

                countdownSection.classList.add(
                    "countdown-hidden"
                );

                countdownSection.style.display =
                    "none";

            }, 1500);


            /* ---------------------------------------------
               RESET PAGE TO TOP
            --------------------------------------------- */

            setTimeout(function () {

                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "instant"
                });

            }, 100);
        }


        /* =====================================================
           INITIAL STATE
        ===================================================== */


        /*
         * IMPORTANT:
         *
         * EXPERIENCE MUST NOT OPEN BEFORE COUNTDOWN.
         */

        if (experience) {

            experience.classList.remove("active");

            experience.style.visibility =
                "hidden";

            experience.style.opacity =
                "0";

            experience.style.pointerEvents =
                "none";

            experience.style.transform =
                "scale(1)";
        }


        /*
         * COUNTDOWN IS ALSO HIDDEN INITIALLY.
         *
         * Loader will reveal it.
         */

        countdownSection.classList.remove(
            "countdown-hidden"
        );

        countdownSection.style.display =
            "none";

        countdownSection.style.opacity =
            "0";

        countdownSection.style.visibility =
            "hidden";

        countdownSection.style.pointerEvents =
            "none";


        /* =====================================================
           SHOW COUNTDOWN AFTER LOADER
        ===================================================== */

        function showCountdown() {

            /*
             * NEVER show countdown if birthday
             * experience is already active.
             */

            if (
                experience &&
                experience.classList.contains("active")
            ) {
                return;
            }


            countdownSection.style.display =
                "flex";

            countdownSection.style.visibility =
                "visible";

            countdownSection.style.pointerEvents =
                "auto";

            countdownSection.style.opacity =
                "0";

            countdownSection.style.transform =
                "scale(1.03)";


            requestAnimationFrame(function () {

                requestAnimationFrame(function () {

                    countdownSection.style.transition =
                        "opacity 1s ease, " +
                        "transform 1.2s cubic-bezier(.22,1,.36,1)";

                    countdownSection.style.opacity =
                        "1";

                    countdownSection.style.transform =
                        "scale(1)";
                });
            });


            updateCountdown();

            countdownInterval =
                setInterval(
                    updateCountdown,
                    1000
                );
        }


        /* =====================================================
           WAIT FOR LOADER
        ===================================================== */

        function waitForLoader() {

            const loader =
                document.getElementById("loader");


            /*
             * If there is no loader,
             * show countdown immediately.
             */

            if (!loader) {

                showCountdown();

                return;
            }


            /*
             * Check whether loader has finished.
             */

            function checkLoader() {

                const loaderStyle =
                    window.getComputedStyle(loader);

                const loaderHidden =
                    loaderStyle.display === "none" ||
                    loaderStyle.visibility === "hidden" ||
                    loader.classList.contains("hidden") ||
                    loader.classList.contains("loaded") ||
                    loader.classList.contains("complete") ||
                    loader.classList.contains("finished");


                if (loaderHidden) {

                    showCountdown();

                    return true;
                }


                return false;
            }


            /*
             * Check immediately.
             */

            if (checkLoader()) return;


            /*
             * Watch loader for class/style changes.
             */

            const observer =
                new MutationObserver(function () {

                    if (checkLoader()) {

                        observer.disconnect();
                    }
                });


            observer.observe(loader, {

                attributes: true,

                attributeFilter: [
                    "class",
                    "style"
                ]
            });


            /*
             * Fallback check.
             */

            const fallback =
                setInterval(function () {

                    if (checkLoader()) {

                        clearInterval(fallback);
                        observer.disconnect();
                    }

                }, 250);
        }


        /* =====================================================
           START
        ===================================================== */

        waitForLoader();


        /* =====================================================
           BLOCK ESCAPE / ENTER DURING COUNTDOWN
        ===================================================== */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    !countdownFinished &&
                    countdownSection.style.display !== "none"
                ) {

                    if (
                        event.key === "Escape" ||
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();
                    }
                }
            }
        );


        console.log(
            "♡ Birthday Countdown initialized."
        );

    }


    /* =========================================================
       DOM READY
    ========================================================= */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initBirthdayCountdown
        );

    } else {

        initBirthdayCountdown();
    }

})();