/* =========================================================
   QUIZZY SOUND SYSTEM
   -----------------------------------------------------------
   Every sound (swoosh, tick, ding, error buzz, background music)
   is synthesized live with the Web Audio API — nothing to
   download, host, or preload as a file, and nothing that can
   ever 404. This keeps the implementation tiny, fast, and
   dependency-free while still sounding polished.

   Public API (window.quizzySound):
     .unlock()                 – create/resume the AudioContext
                                  (call from a user gesture)
     .setSfxEnabled(bool)
     .setMusicEnabled(bool)
     .playSwoosh()
     .playTick()
     .playDing()
     .playError()
     .startMusic() / .stopMusic()
     .suspend() / .resumeIfNeeded() / .destroy()
   ========================================================= */
(function () {
  const STORAGE_KEY_SFX = 'quizzy_sfx_enabled';
  const STORAGE_KEY_MUSIC = 'quizzy_music_enabled';

  function readPref(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v === '1';
    } catch (e) {
      return fallback;
    }
  }

  function writePref(key, value) {
    try {
      localStorage.setItem(key, value ? '1' : '0');
    } catch (e) {
      /* ignore (private mode, etc.) */
    }
  }

  class SoundManager {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.sfxGain = null;
      this.musicGain = null;
      this.unlocked = false;

      this.sfxEnabled = readPref(STORAGE_KEY_SFX, true);
      this.musicEnabled = readPref(STORAGE_KEY_MUSIC, true);

      this.musicPlaying = false;
      this._musicSchedulerId = null;
      this._musicNextNoteTime = 0;
      this._musicStep = 0;

      this._swooshCooldownUntil = 0;
    }

    /* ---------- setup ---------- */

    _ensureContext() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return; // Web Audio unsupported — sounds silently no-op

      this.ctx = new AC();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? 0.9 : 0;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.14 : 0;
      this.musicGain.connect(this.masterGain);
    }

    // Must be called from within a real user gesture handler to satisfy
    // browser autoplay policies (desktop + mobile Safari/Chrome).
    unlock() {
      this._ensureContext();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      this.unlocked = true;
      if (this.musicEnabled && !this.musicPlaying) this.startMusic();
    }

    suspend() {
      if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
    }

    resumeIfNeeded() {
      if (this.ctx && this.unlocked && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    destroy() {
      this.stopMusic();
      if (this.ctx) {
        this.ctx.close().catch(() => {});
        this.ctx = null;
      }
    }

    /* ---------- toggles ---------- */

    setSfxEnabled(on) {
      this.sfxEnabled = on;
      writePref(STORAGE_KEY_SFX, on);
      if (this.sfxGain && this.ctx) {
        this.sfxGain.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.01);
      }
    }

    setMusicEnabled(on) {
      this.musicEnabled = on;
      writePref(STORAGE_KEY_MUSIC, on);
      if (this.musicGain && this.ctx) {
        this.musicGain.gain.setTargetAtTime(on ? 0.14 : 0, this.ctx.currentTime, 0.05);
      }
      if (on && this.unlocked && !this.musicPlaying) this.startMusic();
    }

    /* ---------- low-level tone helper ---------- */

    _tone(type, freq, startTime, duration, destination, peak, attack, release) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(peak, startTime + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(g);
      g.connect(destination);
      osc.start(startTime);
      osc.stop(startTime + duration + release);
    }

    /* ---------- sound effects ---------- */

    playSwoosh() {
      if (!this.sfxEnabled) return;
      this._ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Guards against rapid/duplicate transitions overlapping each other.
      if (now < this._swooshCooldownUntil) return;
      const dur = 0.22;
      this._swooshCooldownUntil = now + dur - 0.02;

      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 0.8;
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.exponentialRampToValueAtTime(3400, now + dur * 0.85);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.3, now + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      noise.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + dur + 0.02);
    }

    playTick() {
      if (!this.sfxEnabled) return;
      this._ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this._tone('square', 1500, now, 0.045, this.sfxGain, 0.1, 0.001, 0.02);
    }

    playDing() {
      if (!this.sfxEnabled) return;
      this._ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this._tone('sine', 1318.51, now, 0.45, this.sfxGain, 0.26, 0.005, 0.12); // E6
      this._tone('sine', 1567.98, now + 0.09, 0.45, this.sfxGain, 0.2, 0.005, 0.12); // G6
    }

    playError() {
      if (!this.sfxEnabled) return;
      this._ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Two soft descending triangle blips — noticeable but not harsh/game-show buzzer-like.
      this._tone('triangle', 220, now, 0.2, this.sfxGain, 0.16, 0.002, 0.04);
      this._tone('triangle', 185, now + 0.09, 0.2, this.sfxGain, 0.12, 0.002, 0.04);
    }

    /* ---------- background music ----------
       A small procedurally-scheduled loop (look-ahead scheduler pattern)
       so it plays gaplessly forever without ever "restarting" a clip. */

    startMusic() {
      if (!this.musicEnabled) return;
      this._ensureContext();
      if (!this.ctx || this.musicPlaying) return;
      this.musicPlaying = true;

      const bpm = 106;
      const secondsPer16th = 60 / bpm / 4;
      const barLength = 16;

      // Am - F - C - G, upbeat/playful progression, plucky arpeggio on top.
      const chords = [
        [220.0, 261.63, 329.63], // A3 C4 E4
        [174.61, 220.0, 261.63], // F3 A3 C4
        [130.81, 164.81, 196.0], // C3 E3 G3
        [196.0, 246.94, 293.66], // G3 B3 D4
      ];
      const arpOffsets = [0, 1, 2, 1];

      this._musicStep = 0;
      this._musicNextNoteTime = this.ctx.currentTime + 0.05;
      const scheduleAheadTime = 0.15;

      const scheduleStep = (time, stepIndex) => {
        const posInBar = stepIndex % barLength;
        const chord = chords[Math.floor(stepIndex / barLength) % chords.length];

        // Soft bass pulse on beats 1 and 3 of the bar.
        if (posInBar === 0 || posInBar === 8) {
          this._tone('sine', chord[0] / 2, time, 0.55, this.musicGain, 0.42, 0.01, 0.3);
        }
        // Bright plucky arpeggio on every 8th note — the "game show" sparkle.
        if (posInBar % 2 === 0) {
          const note = chord[arpOffsets[(posInBar / 2) % arpOffsets.length] % chord.length];
          this._tone('triangle', note * 2, time, 0.2, this.musicGain, 0.2, 0.004, 0.14);
        }
        // Light off-beat shimmer for energy, quieter than the arpeggio.
        if (posInBar % 4 === 2) {
          const note = chord[(arpOffsets[0] + 2) % chord.length];
          this._tone('sine', note * 4, time, 0.12, this.musicGain, 0.06, 0.002, 0.08);
        }
      };

      const scheduler = () => {
        if (!this.musicPlaying || !this.ctx) return;
        while (this._musicNextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
          scheduleStep(this._musicNextNoteTime, this._musicStep);
          this._musicNextNoteTime += secondsPer16th;
          this._musicStep++;
        }
        this._musicSchedulerId = setTimeout(scheduler, 30);
      };
      scheduler();
    }

    stopMusic() {
      this.musicPlaying = false;
      if (this._musicSchedulerId) {
        clearTimeout(this._musicSchedulerId);
        this._musicSchedulerId = null;
      }
    }
  }

  window.quizzySound = new SoundManager();

  /* ---------- audio control UI wiring ----------
     Handles the 🔊/🎵 toggle buttons and unlocking audio on the
     user's first interaction with the page (autoplay-policy safe). */
  function initAudioUI() {
    const sound = window.quizzySound;
    const sfxBtn = document.getElementById('sfx-toggle');
    const musicBtn = document.getElementById('music-toggle');

    function refresh() {
      if (sfxBtn) {
        sfxBtn.classList.toggle('muted', !sound.sfxEnabled);
        sfxBtn.setAttribute('aria-pressed', String(sound.sfxEnabled));
        const icon = sfxBtn.querySelector('.audio-icon');
        if (icon) icon.textContent = sound.sfxEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07';
      }
      if (musicBtn) {
        musicBtn.classList.toggle('muted', !sound.musicEnabled);
        musicBtn.setAttribute('aria-pressed', String(sound.musicEnabled));
      }
    }

    function unlockOnce() {
      sound.unlock();
    }
    document.addEventListener('pointerdown', unlockOnce, { once: true, passive: true });
    document.addEventListener('keydown', unlockOnce, { once: true });

    if (sfxBtn) {
      sfxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.unlock();
        sound.setSfxEnabled(!sound.sfxEnabled);
        if (sound.sfxEnabled) sound.playTick();
        refresh();
      });
    }
    if (musicBtn) {
      musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.unlock();
        sound.setMusicEnabled(!sound.musicEnabled);
        refresh();
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) sound.suspend();
      else sound.resumeIfNeeded();
    });
    window.addEventListener('pagehide', () => sound.destroy());

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioUI);
  } else {
    initAudioUI();
  }
})();
