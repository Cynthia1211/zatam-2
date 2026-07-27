/**
 * sanskrit-time.js
 * Sanskrit time conversion utilities for the कः समयः game.
 * Supports hours 1-12, minutes at 0/15/30/45 intervals.
 */

const SanskritTime = (() => {
  // Sanskrit hour stems
  const HOUR_STEMS = {
    1:  "एक",
    2:  "द्वि",
    3:  "त्रि",
    4:  "चतुर्",
    5:  "पञ्च",
    6:  "षड्",
    7:  "सप्त",
    8:  "अष्ट",
    9:  "नव",
    10: "दश",
    11: "एकादश",
    12: "द्वादश"
  };

  // Minute prefixes for quarter-hour intervals
  const MINUTE_PREFIXES = {
    0:  "",          // On the hour
    15: "सपाद-",     // Quarter past
    30: "सार्ध-",    // Half past
    45: "पादोन-"     // Quarter to (next hour)
  };

  // Devanagari digits
  const DEVA_DIGITS = "०१२३४५६७८९";

  /**
   * Convert an integer to Devanagari numerals.
   */
  function toDevanagari(num) {
    return String(num).split("").map(d => DEVA_DIGITS[parseInt(d)]).join("");
  }

  /**
   * Get the Sanskrit time string for given hour (1-12) and minute (0/15/30/45).
   * @param {number} hr  - Hour 1-12
   * @param {number} min - Minute: 0, 15, 30, or 45
   * @returns {string} Sanskrit time string e.g. "सपाद-त्रि-वादनम्"
   */
  function getSanskritTime(hr, min) {
    let displayHr = hr;

    // For 45 minutes (quarter-to), we reference the NEXT hour
    if (min === 45) {
      displayHr = hr >= 12 ? 1 : hr + 1;
    }

    const prefix = MINUTE_PREFIXES[min] || "";
    const hourStem = HOUR_STEMS[displayHr] || "";
    return prefix + hourStem + "-वादनम्";
  }

  /**
   * Get a display-friendly time string like "३:१५"
   */
  function getTimeDisplay(hr, min) {
    return toDevanagari(hr) + ":" + toDevanagari(String(min).padStart(2, "0"));
  }

  /**
   * Get English time string like "3:15"
   */
  function getTimeDisplayEN(hr, min) {
    return hr + ":" + String(min).padStart(2, "0");
  }

  /**
   * Get all 48 valid time entries.
   * @returns {Array<{hr: number, min: number, sanskrit: string, display: string}>}
   */
  function getAllTimes() {
    const times = [];
    for (let hr = 1; hr <= 12; hr++) {
      for (const min of [0, 15, 30, 45]) {
        times.push({
          hr,
          min,
          sanskrit: getSanskritTime(hr, min),
          display: getTimeDisplay(hr, min),
          displayEN: getTimeDisplayEN(hr, min)
        });
      }
    }
    return times;
  }

  /**
   * Generate distractor Sanskrit times (wrong answers) that differ from the correct one.
   * @param {number} correctHr
   * @param {number} correctMin
   * @param {number} count - Number of distractors to generate
   * @returns {Array<{hr: number, min: number, sanskrit: string}>}
   */
  function getDistractors(correctHr, correctMin, count) {
    const correctStr = getSanskritTime(correctHr, correctMin);
    const all = getAllTimes().filter(t => t.sanskrit !== correctStr);

    // Shuffle using Fisher-Yates
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    return all.slice(0, count);
  }

  /**
   * Generate a random time entry.
   * @returns {{hr: number, min: number, sanskrit: string, display: string}}
   */
  function getRandomTime() {
    const hr = Math.floor(Math.random() * 12) + 1;
    const mins = [0, 15, 30, 45];
    const min = mins[Math.floor(Math.random() * 4)];
    return {
      hr,
      min,
      sanskrit: getSanskritTime(hr, min),
      display: getTimeDisplay(hr, min),
      displayEN: getTimeDisplayEN(hr, min)
    };
  }

  /**
   * Compute the angle in degrees for the hour hand.
   * 12 o'clock = 0°, 3 o'clock = 90°, etc.
   * The hour hand also moves slightly based on minutes.
   */
  function hourAngle(hr, min) {
    const h = hr % 12;
    return (h * 30) + (min * 0.5);
  }

  /**
   * Compute the angle in degrees for the minute hand.
   * 0 min = 0° (12 o'clock), 15 min = 90°, etc.
   */
  function minuteAngle(min) {
    return min * 6;
  }

  /**
   * From hand angles, derive the closest valid time.
   * @param {number} hAngle - Hour hand angle in degrees (0-360)
   * @param {number} mAngle - Minute hand angle in degrees (0-360)
   * @returns {{hr: number, min: number}}
   */
  function angleToTime(hAngle, mAngle) {
    // Normalize angles to 0-360
    hAngle = ((hAngle % 360) + 360) % 360;
    mAngle = ((mAngle % 360) + 360) % 360;

    // Snap minute to nearest 15 min
    const mins = [0, 15, 30, 45];
    const mAngles = [0, 90, 180, 270];
    let closestMin = 0;
    let minDist = 360;
    for (let i = 0; i < 4; i++) {
      let dist = Math.abs(mAngle - mAngles[i]);
      if (dist > 180) dist = 360 - dist;
      if (dist < minDist) {
        minDist = dist;
        closestMin = mins[i];
      }
    }

    // Snap hour — account for minute offset
    let hr = Math.round((hAngle - closestMin * 0.5) / 30);
    hr = ((hr % 12) + 12) % 12;
    if (hr === 0) hr = 12;

    return { hr, min: closestMin };
  }

  return {
    getSanskritTime,
    getTimeDisplay,
    getTimeDisplayEN,
    getAllTimes,
    getDistractors,
    getRandomTime,
    hourAngle,
    minuteAngle,
    angleToTime,
    toDevanagari,
    HOUR_STEMS,
    MINUTE_PREFIXES
  };
})();
