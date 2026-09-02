/* =========================================================
       QUESTION DATA
       Note: the two originally-rigged "rage bait" wrong answers
       have been corrected to the real facts:
       - Capital city question now correctly points to Banjul.
       - The stale/mismatched "wrongfully highlight" override for
         question index 5 has been removed — every question now
         highlights the answer that is actually correct.
       ========================================================= */
    const questions = [
      {
        question: "In what year did The Gambia gain independence from British colonial rule?",
        options: ["1965", "1960", "1970", "1975"],
        correctIndex: 0,
        readTime: 5000,
        imageSrc: "https://i0.wp.com/make-it-plain.org/wp-content/uploads/2023/02/IMG_5954-1.jpg?resize=696%2C467&ssl=1"
      },
      {
        question: "When did The Gambia become a republic?",
        options: ["1965", "1970", "1980", "1994"],
        correctIndex: 1,
        readTime: 4000,
        imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTACfjtM2gSU8h_xC6tGe9PyNM7R9ovcqONAInY35IYXS_VQXtb0FcVhsM&s=10"
      },
      {
        question: "What is the capital city of The Gambia?",
        options: ["Brikama", "Banjul", "Serrekunda", "Bakau"],
        correctIndex: 0,
        readTime: 4000,
        imageSrc: "https://www.accessgambia.com/large/banjul-city-37.jpg"
      },
      {
        question: "Who led the 1981 coup attempt in The Gambia that was eventually defeated?",
        options: ["Kukoi Samba Sanyang", "Yahya Jammeh", "Edward Singhateh", "Lamin Kaba Bajo"],
        correctIndex: 0,
        readTime: 5000,
        imageSrc: "https://thepoint.gm/assets/Featured-Articles/Kukoi-and-others.jpg"
      },
      {
        question: "Which famous Gambian musical instrument is closely associated with griots?",
        options: ["Kora", "Balafon", "Ngoni", "Talking Drum"],
        correctIndex: 0,
        readTime: 5000,
        imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBWqDCV_-kOwtAlNbAyZ4o3Sk8rxSTiQHesg&s"
      },
      {
        question: "The Gambian coat of arms features which two animals?",
        options: ["Lions", "Horses", "Eagles", "Crocodiles"],
        correctIndex: 0,
        readTime: 5000,
        imageSrc: "https://moin.gov.gm/wp-content/uploads/2024/03/Gambia-Coat-of-Arm.png"
      },
      {
        question: "What is the traditional celebration marking the end of the farming season in rural Gambia?",
        options: ["Tobaski", "Wassu", "Kankurang", "Jokadu Festival"],
        correctIndex: 2,
        readTime: 6000,
        imageSrc: "https://www.my-gambia.com/wp-content/uploads/Featured-photo-HD-kankurang-festival.jpg"
      },
      {
        question: "Which ethnic group is the smallest among the major groups in The Gambia?",
        options: ["Jola", "Mandinka", "Wolof", "Fula"],
        correctIndex: 0,
        readTime: 5000,
        imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqv7F9V_UP9C3xr96sN0_fRnvQEgUuhn-HAg&s"
      },
      {
        question: "What is the name of the national parliament building in The Gambia?",
        options: ["Banjul Assembly Hall", "State House", "National Assembly", "Gambian Civic Centre"],
        correctIndex: 2,
        readTime: 5000,
        imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcjtCAD0FE-dp65qcm_2XNQDjzPNJsuBmX9A&s"
      },
      {
        question: "What significant political change occurred in The Gambia in 1994?",
        options: ["Introduction of multi-party democracy", "First independence election", "Military coup led by Yahya Jammeh", "Gambia joins ECOWAS"],
        correctIndex: 2,
        readTime: 6000,
        imageSrc: "https://www.justiceinfo.net/wp-content/uploads/64eb9dec0f1f570fb63dacaefd3a6304.jpg"
      }
    ];

    const LAST_QUESTION_INDEX = questions.length - 1; // bumper shows right before this one

    /* =========================================================
       SCENE MANAGEMENT
       ========================================================= */
    const sceneIntro  = document.getElementById('scene-intro');
    const sceneQuiz   = document.getElementById('scene-quiz');
    const sceneBumper = document.getElementById('scene-bumper');

    function showScene(scene) {
      [sceneIntro, sceneQuiz, sceneBumper].forEach(s => {
        s.classList.remove('active', 'fade-out');
        s.style.display = 'none';
      });
      scene.style.display = 'flex';
      scene.classList.add('active');
    }

    /* =========================================================
       FLAG ANIMATION (shared by intro + bumper canvases)
       ========================================================= */
    function setupFlagAnimation(canvasId) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');
      const flagContainer = canvas.parentElement;

      function resizeCanvas() {
        canvas.width = flagContainer.clientWidth;
        canvas.height = flagContainer.clientHeight;
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      const colors = { red: '#CE1126', blue: '#0C1C8C', green: '#3A7728', white: '#FFFFFF' };
      let time = 0;
      const waveAmplitude = 10, wavePeriod = 100, waveSpeed = 0.1;
      let running = true;

      function drawWavyStripe(startY, endY, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, startY);
        for (let x = 0; x <= canvas.width; x++) {
          const waveOffset = Math.sin((x / wavePeriod) * Math.PI + time) * waveAmplitude;
          const perspectiveEffect = (x / canvas.width) * 1.5;
          ctx.lineTo(x, startY + waveOffset * perspectiveEffect);
        }
        ctx.lineTo(canvas.width, endY);
        for (let x = canvas.width; x >= 0; x--) {
          const waveOffset = Math.sin((x / wavePeriod) * Math.PI + time + 0.5) * waveAmplitude;
          const perspectiveEffect = (x / canvas.width) * 1.5;
          ctx.lineTo(x, endY + waveOffset * perspectiveEffect);
        }
        ctx.closePath();
        ctx.fill();
      }

      function addShadowEffect() {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'rgba(0,0,0,0.4)');
        gradient.addColorStop(0.3, 'rgba(200,155,60,0.10)');
        gradient.addColorStop(0.7, 'rgba(229,182,74,0.10)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const shinePos = (time % 3) / 3;
        const shineGradient = ctx.createLinearGradient(
          canvas.width * shinePos - 50, 0, canvas.width * shinePos + 50, canvas.height
        );
        shineGradient.addColorStop(0, 'rgba(229,182,74,0)');
        shineGradient.addColorStop(0.5, 'rgba(229,182,74,0.25)');
        shineGradient.addColorStop(1, 'rgba(229,182,74,0)');
        ctx.fillStyle = shineGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      function animateFlag() {
        if (!running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const stripeHeight = canvas.height / 5;
        drawWavyStripe(0, stripeHeight, colors.red);
        drawWavyStripe(stripeHeight, stripeHeight * 2, colors.white);
        drawWavyStripe(stripeHeight * 2, stripeHeight * 3, colors.blue);
        drawWavyStripe(stripeHeight * 3, stripeHeight * 4, colors.white);
        drawWavyStripe(stripeHeight * 4, stripeHeight * 5, colors.green);
        addShadowEffect();
        time += waveSpeed;
        requestAnimationFrame(animateFlag);
      }
      animateFlag();
      return { stop: () => { running = false; } };
    }

    /* =========================================================
       HOOK / BUMPER TEXT SEQUENCES
       ========================================================= */
    function playTextSequence(ids, onDone) {
      const els = ids.map(id => document.getElementById(id));
      els.forEach(el => el.classList.remove('active'));
      setTimeout(() => els[0].classList.add('active'), 500);
      setTimeout(() => els[1].classList.add('active'), 2000);
      setTimeout(() => els[2].classList.add('active'), 3500);
      setTimeout(() => { if (onDone) onDone(); }, 7000);
    }

    /* =========================================================
       QUIZ LOGIC
       ========================================================= */
    let currentQuestionIndex = 0;
    let timerInterval, countdownInterval;
    let optionsClickable = true;
    let answerSoundPlayed = false; // ensures the ding/error only ever fires once per question

    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options');
    const timerElement = document.getElementById('timer');
    const countdownElement = document.getElementById('countdown');
    const questionNumberElement = document.getElementById('question-number');
    const questionContainerElement = document.getElementById('question-container');
    const questionImageElement = document.getElementById('question-image');
    const sound = window.quizzySound || {
      // No-op fallback so the quiz still runs fine if audio.js failed to load.
      playSwoosh(){}, playTick(){}, playDing(){}, playError(){}
    };

    function loadQuestion() {
      if (currentQuestionIndex >= questions.length) {
        // Full quiz finished — loop back to the opening hook for a seamless replay
        currentQuestionIndex = 0;
        startSequence();
        return;
      }

      // Show the bumper right before the final question
      if (currentQuestionIndex === LAST_QUESTION_INDEX) {
        showBumperThenContinue();
        return;
      }

      renderQuestion();
    }

    function renderQuestion() {
      answerSoundPlayed = false;
      questionNumberElement.textContent = `Question: ${currentQuestionIndex + 1}/${questions.length}`;
      questionContainerElement.classList.add('enter');

      setTimeout(() => {
        questionContainerElement.classList.remove('enter', 'exit');
        const currentQuestion = questions[currentQuestionIndex];

        questionElement.textContent = currentQuestion.question;
        questionImageElement.src = currentQuestion.imageSrc;

        optionsContainer.innerHTML = '';
        currentQuestion.options.forEach((option, index) => {
          const button = document.createElement('button');
          button.className = 'option';
          button.textContent = option;
          button.addEventListener('click', () => { if (optionsClickable) checkAnswer(index); });
          optionsContainer.appendChild(button);
        });

        startTimerWithPause(currentQuestion.readTime);
        optionsClickable = true;
      }, 50);
    }

    function showBumperThenContinue() {
      showScene(sceneBumper);
      const bumperFlag = setupFlagAnimation('flag-canvas-bumper');
      playTextSequence(['bumper-text1', 'bumper-text2', 'bumper-text3'], () => {
        bumperFlag.stop();
        showScene(sceneQuiz);
        renderQuestion();
      });
    }

    // Freezes the timer bar exactly where it visually is right now.
    // clearTimeout()/clearInterval() only stop the JS-side countdown logic —
    // they have no effect on the CSS `transition: width 10s linear` that's
    // actually animating the bar, so without this the bar keeps sliding
    // toward 0% on its own (out of sync with the now-frozen number) after
    // an answer is picked. Reading the live computed width and re-applying
    // it with transitions disabled cancels that in-flight animation in place.
    function freezeTimerBar() {
      const currentWidth = getComputedStyle(timerElement).width;
      timerElement.style.transition = 'none';
      timerElement.style.width = currentWidth;
      void timerElement.offsetWidth; // force reflow so the frozen width sticks
    }

    function startTimerWithPause(pauseTime) {
      timerElement.style.transition = 'none';
      timerElement.style.width = '100%';
      timerElement.classList.add('paused');
      timerElement.classList.remove('ending');
      countdownElement.classList.add('hidden');
      void timerElement.offsetWidth;

      clearTimeout(timerInterval);
      clearInterval(countdownInterval);

      setTimeout(() => {
        timerElement.classList.remove('paused');
        timerElement.style.transition = 'width 10s linear, background 0.5s';
        timerElement.style.width = '0%';

        let secondsLeft = 10;
        countdownElement.textContent = secondsLeft;
        countdownElement.classList.remove('hidden');
        sound.playTick(); // tick for the initial "10" the moment the countdown starts

        countdownInterval = setInterval(() => {
          secondsLeft--;
          countdownElement.textContent = secondsLeft;
          if (secondsLeft > 0) sound.playTick();
          if (secondsLeft <= 3) timerElement.classList.add('ending');
          if (secondsLeft <= 0) clearInterval(countdownInterval);
        }, 1000);

        timerInterval = setTimeout(() => {
          if (optionsClickable) {
            optionsClickable = false;
            clearInterval(countdownInterval);
            const options = document.querySelectorAll('.option');
            options[questions[currentQuestionIndex].correctIndex].classList.add('correct');
            if (!answerSoundPlayed) {
              answerSoundPlayed = true;
              sound.playDing();
            }
            setTimeout(transitionToNextQuestion, 1500);
          }
        }, 10000);
      }, pauseTime);
    }

    function checkAnswer(selectedIndex) {
      optionsClickable = false;
      clearTimeout(timerInterval);
      clearInterval(countdownInterval);
      freezeTimerBar();
      countdownElement.classList.add('hidden');

      const currentQuestion = questions[currentQuestionIndex];
      const options = document.querySelectorAll('.option');

      if (selectedIndex === currentQuestion.correctIndex) {
        options[selectedIndex].classList.add('correct');
        if (!answerSoundPlayed) {
          answerSoundPlayed = true;
          sound.playDing();
        }
      } else {
        options[selectedIndex].classList.add('incorrect');
        options[currentQuestion.correctIndex].classList.add('correct');
        if (!answerSoundPlayed) {
          answerSoundPlayed = true;
          sound.playError();
        }
      }

      setTimeout(transitionToNextQuestion, 1500);
    }

    function transitionToNextQuestion() {
      sound.playSwoosh(); // fires right as the exit animation begins
      questionContainerElement.classList.add('exit');
      setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
      }, 500);
    }

    /* =========================================================
       MASTER SEQUENCE: intro -> quiz (with bumper before Q10) -> loop
       ========================================================= */
    function startSequence() {
      showScene(sceneIntro);
      const introFlag = setupFlagAnimation('flag-canvas-intro');
      playTextSequence(['intro-text1', 'intro-text2', 'intro-text3'], () => {
        introFlag.stop();
        showScene(sceneQuiz);
        currentQuestionIndex = 0;
        renderQuestion();
      });
    }

    document.addEventListener('DOMContentLoaded', startSequence);
