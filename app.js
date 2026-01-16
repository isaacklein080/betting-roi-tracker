document.addEventListener("DOMContentLoaded", () => {
  const calendarEl = document.getElementById("calendar");
  const monthLabel = document.getElementById("monthLabel");
  const selectedDateLabel = document.getElementById("selectedDateLabel");

  const sportsForm = document.getElementById("sportsForm");
  const horseForm = document.getElementById("horseForm");

  const betType = document.getElementById("betType");
  const legsSection = document.getElementById("legsSection");
  const numLegsInput = document.getElementById("numLegs");
  const legsContainer = document.getElementById("legsContainer");

  const roiOutput = document.getElementById("roiOutput");
  const betTable = document.getElementById("betTable");

  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");

  const tabButtons = document.querySelectorAll(".tab-btn");

  const horseMode = document.getElementById("horseMode");
  const singleRaceSection = document.getElementById("singleRaceSection");
  const multiRaceSection = document.getElementById("multiRaceSection");
  const buildMultiRacesBtn = document.getElementById("buildMultiRaces");
  const multiRaceContainer = document.getElementById("multiRaceContainer");

  const kindFilter = document.getElementById("kindFilter");
  const resultFilter = document.getElementById("resultFilter");
  const exportCsvBtn = document.getElementById("exportCsv");

  const monthlySummaryEl = document.getElementById("monthlySummary");
  const weeklySummaryEl = document.getElementById("weeklySummary");
  const streakSummaryEl = document.getElementById("streakSummary");
  const categoryBreakdownEl = document.getElementById("categoryBreakdown");

  const dayNotesEl = document.getElementById("dayNotes");
  const saveNotesBtn = document.getElementById("saveNotes");

  const startingBankrollInput = document.getElementById("startingBankroll");
  const saveBankrollBtn = document.getElementById("saveBankroll");
  const bankrollSummaryEl = document.getElementById("bankrollSummary");

  let bets = JSON.parse(localStorage.getItem("bets_v3")) || [];
  let notes = JSON.parse(localStorage.getItem("notes_v1")) || {};
  let bankroll = JSON.parse(localStorage.getItem("bankroll_v1")) || { starting: 0 };

  let currentYear;
  let currentMonth;
  let selectedDate = null;

  const SPORTS = ["Basketball", "Football", "Baseball", "Soccer", "Tennis"];
  const CATEGORIES = [
    "Player Prop",
    "Team Bet",
    "Moneyline",
    "Spread",
    "Total (O/U)",
    "Horses – Win",
    "Horses – Exotic",
    "Other"
  ];

  // ---------- INIT DATE ----------
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  selectedDate = formatDate(today);
  selectedDateLabel.textContent = `Bets for ${selectedDate}`;

  startingBankrollInput.value = bankroll.starting || 0;

  // ---------- HELPERS ----------
  function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDateFromParts(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function saveBets() {
    localStorage.setItem("bets_v3", JSON.stringify(bets));
  }

  function saveNotes() {
    localStorage.setItem("notes_v1", JSON.stringify(notes));
  }

  function saveBankroll() {
    localStorage.setItem("bankroll_v1", JSON.stringify(bankroll));
  }

  function parseDateStr(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function getWeekKey(dateStr) {
    const d = parseDateStr(dateStr);
    const tmp = new Date(d.getTime());
    tmp.setHours(0, 0, 0, 0);
    const day = (tmp.getDay() + 6) % 7;
    tmp.setDate(tmp.getDate() - day);
    const year = tmp.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const week = Math.floor(((tmp - oneJan) / 86400000 + oneJan.getDay() + 1) / 7) + 1;
    return `${year}-W${String(week).padStart(2, "0")}`;
  }

  // ---------- CALENDAR ----------
  function buildCalendar() {
    calendarEl.innerHTML = "";

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    monthLabel.textContent = new Date(currentYear, currentMonth, 1).toLocaleString("default", {
      month: "long",
      year: "numeric"
    });

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekdays.forEach(d => {
      const div = document.createElement("div");
      div.textContent = d;
      div.className = "calendar-header";
      calendarEl.appendChild(div);
    });

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      calendarEl.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateFromParts(currentYear, currentMonth, day);
      const div = document.createElement("div");
      div.textContent = day;
      div.className = "calendar-day";

      const dayBets = bets.filter(b => b.date === dateStr);
      if (dayBets.length > 0) {
        div.classList.add("has-bets");
        let profit = 0;
        dayBets.forEach(b => profit += (b.payout - b.stake));
        if (profit > 0) div.classList.add("profit-day");
        else if (profit < 0) div.classList.add("loss-day");
      }

      if (dateStr === selectedDate) {
        div.classList.add("selected");
      }

      div.addEventListener("click", () => {
        selectedDate = dateStr;
        document.querySelectorAll(".calendar-day").forEach(d => d.classList.remove("selected"));
        div.classList.add("selected");
        selectedDateLabel.textContent = `Bets for ${selectedDate}`;
        loadNotesForDay();
        renderROI();
        renderTable();
      });

      calendarEl.appendChild(div);
    }
  }

  prevMonthBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    buildCalendar();
    renderROI();
    renderTable();
    renderMonthlySummary();
    renderWeeklySummary();
    renderStreaks();
    renderCategoryBreakdown();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    buildCalendar();
    renderROI();
    renderTable();
    renderMonthlySummary();
    renderWeeklySummary();
    renderStreaks();
    renderCategoryBreakdown();
  });

  // ---------- TABS ----------
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const tab = btn.dataset.tab;
      if (tab === "sports") {
        sportsForm.style.display = "block";
        horseForm.style.display = "none";
      } else {
        sportsForm.style.display = "none";
        horseForm.style.display = "block";
      }
    });
  });

  // ---------- SPORTS FORM ----------
  betType.addEventListener("change", () => {
    const isParlay = betType.value === "Parlay";
    legsSection.style.display = isParlay ? "block" : "none";
    legsContainer.innerHTML = "";
  });

  document.getElementById("buildLegs").addEventListener("click", () => {
    const n = parseInt(numLegsInput.value, 10);
    if (isNaN(n) || n < 1) return;

    legsContainer.innerHTML = "";

    for (let i = 0; i < n; i++) {
      const div = document.createElement("div");
      div.innerHTML = `
        <select class="sport">
          ${SPORTS.map(s => `<option value="${s}">${s}</option>`).join("")}
        </select>
        <select class="category">
          ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("")}
        </select>
        <input type="text" class="customCategory" placeholder="Custom" style="display:none">
      `;
      legsContainer.appendChild(div);
    }

    document.querySelectorAll(".category").forEach(sel => {
      sel.addEventListener("change", e => {
        const customInput = e.target.parentElement.querySelector(".customCategory");
        customInput.style.display = e.target.value === "Other" ? "block" : "none";
      });
    });
  });

  sportsForm.addEventListener("submit", e => {
    e.preventDefault();

    if (!selectedDate) {
      alert("Select a date on the calendar first");
      return;
    }

    const stake = parseFloat(document.getElementById("stake").value);
    const payout = parseFloat(document.getElementById("payout").value);
    if (isNaN(stake) || isNaN(payout)) return;

    let legs = [];

    if (betType.value === "Straight") {
      legs.push({ sport: "N/A", category: "Straight" });
    } else {
      document.querySelectorAll("#legsContainer > div").forEach(div => {
        const sport = div.querySelector(".sport").value;
        const catSel = div.querySelector(".category");
        const category =
          catSel.value === "Other"
            ? (div.querySelector(".customCategory").value || "Other")
            : catSel.value;

        legs.push({ sport, category });
      });
    }

    const bet = {
      id: Date.now(),
      date: selectedDate,
      kind: "sports",
      mode: betType.value === "Parlay" ? "parlay" : "straight",
      type: betType.value,
      stake,
      payout,
      legs
    };

    bets.push(bet);
    saveBets();

    buildCalendar();
    renderROI();
    renderTable();
    renderMonthlySummary();
    renderWeeklySummary();
    renderStreaks();
    renderCategoryBreakdown();
    renderBankroll();

    sportsForm.reset();
    legsContainer.innerHTML = "";
    legsSection.style.display = "none";
  });

  // ---------- HORSE FORM ----------
  horseMode.addEventListener("change", () => {
    const isMulti = horseMode.value === "multi";
    singleRaceSection.style.display = isMulti ? "none" : "block";
    multiRaceSection.style.display = isMulti ? "block" : "none";
  });

  buildMultiRacesBtn.addEventListener("click", () => {
    const n = parseInt(document.getElementById("numMultiRaces").value);
    if (isNaN(n) || n < 2) return;

    multiRaceContainer.innerHTML = "";

    for (let i = 1; i <= n; i++) {
      const div = document.createElement("div");
      div.className = "multi-race-box";
      div.innerHTML = `
        <input type="number" class="multiRaceNumber" placeholder="Race #" min="1">
        <input type="text" class="multiRaceHorse" placeholder="Horse name">
      `;
      multiRaceContainer.appendChild(div);
    }
  });

  horseForm.addEventListener("submit", e => {
    e.preventDefault();

    if (!selectedDate) {
      alert("Select a date on the calendar first");
      return;
    }

    const stake = parseFloat(document.getElementById("horseStake").value);
    const payout = parseFloat(document.getElementById("horsePayout").value);

    if (isNaN(stake) || isNaN(payout)) return;

    let bet;

    if (horseMode.value === "single") {
      const track = document.getElementById("track").value.trim();
      const raceNumber = parseInt(document.getElementById("raceNumber").value, 10);
      const horseName = document.getElementById("horseName").value.trim();
      const horseBetType = document.getElementById("horseBetType").value;

      bet = {
        id: Date.now(),
        date: selectedDate,
        kind: "horses",
        mode: "single",
        type: horseBetType,
        stake,
        payout,
        track: track || "Unknown track",
        raceNumber: isNaN(raceNumber) ? null : raceNumber,
        horseName: horseName || "Unknown horse"
      };
    } else {
      const races = [];
      document.querySelectorAll(".multi-race-box").forEach(box => {
        const raceNum = parseInt(box.querySelector(".multiRaceNumber").value);
        const horse = box.querySelector(".multiRaceHorse").value.trim();

        races.push({
          race: isNaN(raceNum) ? null : raceNum,
          horse: horse || "Unknown horse"
        });
      });

      bet = {
        id: Date.now(),
        date: selectedDate,
        kind: "horses",
        mode: "multi",
        stake,
        payout,
        races
      };
    }

    bets.push(bet);
    saveBets();

    buildCalendar();
    renderROI();
    renderTable();
    renderMonthlySummary();
    renderWeeklySummary();
    renderStreaks();
    renderCategoryBreakdown();
    renderBankroll();

    horseForm.reset();
    multiRaceContainer.innerHTML = "";
  });

  // ---------- FILTERS & EXPORT ----------
  kindFilter.addEventListener("change", () => {
    renderTable();
  });

  resultFilter.addEventListener("change", () => {
    renderTable();
  });

  exportCsvBtn.addEventListener("click", () => {
    if (bets.length === 0) {
      alert("No bets to export.");
      return;
    }

    const header = [
      "id",
      "date",
      "kind",
      "mode",
      "type",
      "stake",
      "payout",
      "profit",
      "details"
    ];

    const rows = bets.map(b => {
      const profit = b.payout - b.stake;
      let details = "";

      if (b.kind === "sports") {
        if (b.mode === "straight") {
          details = "Straight bet";
        } else {
          details = `${b.legs?.length || 0} legs parlay`;
        }
      } else {
        if (b.mode === "single") {
          details = `${b.track} – Race ${b.raceNumber} – ${b.horseName} (${b.type})`;
        } else {
          const raceList = (b.races || [])
            .map(r => `R${r.race}: ${r.horse}`)
            .join(" -> ");
          details = `Multi‑Race: ${raceList}`;
        }
      }

      return [
        b.id,
        b.date,
        b.kind,
        b.mode || "",
        b.type || "",
        b.stake,
        b.payout,
        profit,
        details.replace(/,/g, ";")
      ];
    });

    const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bets_export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ---------- NOTES ----------
  function loadNotesForDay() {
    dayNotesEl.value = notes[selectedDate] || "";
  }

  saveNotesBtn.addEventListener("click", () => {
    notes[selectedDate] = dayNotesEl.value;
    saveNotes();
  });

  // ---------- BANKROLL ----------
  saveBankrollBtn.addEventListener("click", () => {
    const val = parseFloat(startingBankrollInput.value);
    bankroll.starting = isNaN(val) ? 0 : val;
    saveBankroll();
    renderBankroll();
  });

  function renderBankroll() {
    let totalProfit = 0;
    bets.forEach(b => {
      totalProfit += (b.payout - b.stake);
    });

    const current = (bankroll.starting || 0) + totalProfit;
    const sign = totalProfit >= 0 ? "+" : "";

    bankrollSummaryEl.innerHTML = `
      <strong>Starting:</strong> $${(bankroll.starting || 0).toFixed(2)}<br>
      <strong>Total Profit:</strong> ${sign}$${totalProfit.toFixed(2)}<br>
      <strong>Current Bankroll:</strong> $${current.toFixed(2)}
    `;
  }

  // ---------- RENDERERS ----------
  function renderROI() {
    const dayBets = bets.filter(b => b.date === selectedDate);
    if (dayBets.length === 0) {
      roiOutput.textContent = "No bets yet.";
      return;
    }

    let totalStake = 0;
    let totalProfit = 0;

    dayBets.forEach(b => {
      totalStake += b.stake;
      totalProfit += b.payout - b.stake;
    });

    const roi = totalStake === 0 ? 0 : (totalProfit / totalStake) * 100;
    const sign = totalProfit >= 0 ? "+" : "";
    roiOutput.innerHTML =
      `<strong>Daily ROI:</strong> ${roi.toFixed(2)}% (${sign}$${totalProfit.toFixed(2)})`;
  }

  function renderTable() {
    betTable.innerHTML = "";

    let dayBets = bets.filter(b => b.date === selectedDate);

    if (kindFilter.value !== "all") {
      dayBets = dayBets.filter(b => b.kind === kindFilter.value);
    }

    if (resultFilter.value !== "all") {
      dayBets = dayBets.filter(b => {
        const profit = b.payout - b.stake;
        if (resultFilter.value === "profit") return profit > 0;
        if (resultFilter.value === "loss") return profit < 0;
        if (resultFilter.value === "even") return profit === 0;
        return true;
      });
    }

    if (dayBets.length === 0) return;

    dayBets.forEach(bet => {
      const profit = bet.payout - bet.stake;

      let details = "";
      if (bet.kind === "sports") {
        if (bet.mode === "straight") {
          details = "Straight bet";
        } else {
          details = `${bet.legs?.length || 0} legs parlay`;
        }
      } else {
        if (bet.mode === "single") {
          details = `${bet.track} – Race ${bet.raceNumber} – ${bet.horseName} (${bet.type})`;
        } else {
          const raceList = (bet.races || [])
            .map(r => `R${r.race}: ${r.horse}`)
            .join(" → ");
          details = `Multi‑Race Bet (${bet.races.length} races): ${raceList}`;
        }
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${bet.kind === "sports" ? "Sports" : "Horses"}</td>
        <td>${details}</td>
        <td>$${bet.stake.toFixed(2)}</td>
        <td>$${bet.payout.toFixed(2)}</td>
        <td style="color:${profit >= 0 ? "#22c55e" : "#f97373"};">
          ${profit >= 0 ? "+" : ""}$${profit.toFixed(2)}
        </td>
        <td><button class="delete-btn" data-id="${bet.id}">✕</button></td>
      `;
      betTable.appendChild(tr);
    });

    betTable.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        bets = bets.filter(b => b.id !== id);
        saveBets();
        buildCalendar();
        renderROI();
        renderTable();
        renderMonthlySummary();
        renderWeeklySummary();
        renderStreaks();
        renderCategoryBreakdown();
        renderBankroll();
      });
    });
  }

  function renderMonthlySummary() {
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const monthBets = bets.filter(b => b.date.startsWith(monthStr));

    if (monthBets.length === 0) {
      monthlySummaryEl.textContent = "No bets this month.";
      return;
    }

    let totalStake = 0;
    let totalProfit = 0;

    monthBets.forEach(b => {
      totalStake += b.stake;
      totalProfit += b.payout - b.stake;
    });

    const roi = totalStake === 0 ? 0 : (totalProfit / totalStake) * 100;
    const sign = totalProfit >= 0 ? "+" : "";

    monthlySummaryEl.innerHTML = `
      <strong>Total Bets:</strong> ${monthBets.length}<br>
      <strong>Total Stake:</strong> $${totalStake.toFixed(2)}<br>
      <strong>Total Profit:</strong> ${sign}$${totalProfit.toFixed(2)}<br>
      <strong>Monthly ROI:</strong> ${roi.toFixed(2)}%
    `;
  }

  function renderWeeklySummary() {
    const todayStr = formatDate(today);
    const thisWeekKey = getWeekKey(todayStr);

    const weekBets = bets.filter(b => getWeekKey(b.date) === thisWeekKey);

    if (weekBets.length === 0) {
      weeklySummaryEl.textContent = "No bets this week.";
      return;
    }

    let totalStake = 0;
    let totalProfit = 0;

    weekBets.forEach(b => {
      totalStake += b.stake;
      totalProfit += b.payout - b.stake;
    });

    const roi = totalStake === 0 ? 0 : (totalProfit / totalStake) * 100;
    const sign = totalProfit >= 0 ? "+" : "";

    weeklySummaryEl.innerHTML = `
      <strong>Bets this week:</strong> ${weekBets.length}<br>
      <strong>Stake:</strong> $${totalStake.toFixed(2)}<br>
      <strong>Profit:</strong> ${sign}$${totalProfit.toFixed(2)}<br>
      <strong>Weekly ROI:</strong> ${roi.toFixed(2)}%
    `;
  }

  function renderStreaks() {
    if (bets.length === 0) {
      streakSummaryEl.textContent = "No streak data yet.";
      return;
    }

    const dailyMap = {};
    bets.forEach(b => {
      if (!dailyMap[b.date]) dailyMap[b.date] = 0;
      dailyMap[b.date] += (b.payout - b.stake);
    });

    const dates = Object.keys(dailyMap).sort();
    let bestWinStreak = 0;
    let bestLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    dates.forEach(d => {
      const profit = dailyMap[d];
      if (profit > 0) {
        currentWinStreak++;
        bestWinStreak = Math.max(bestWinStreak, currentWinStreak);
        currentLossStreak = 0;
      } else if (profit < 0) {
        currentLossStreak++;
        bestLossStreak = Math.max(bestLossStreak, currentLossStreak);
        currentWinStreak = 0;
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    });

    streakSummaryEl.innerHTML = `
      <strong>Best Winning Streak (days):</strong> ${bestWinStreak}<br>
      <strong>Best Losing Streak (days):</strong> ${bestLossStreak}
    `;
  }

  function renderCategoryBreakdown() {
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const monthBets = bets.filter(b => b.date.startsWith(monthStr));

    if (monthBets.length === 0) {
      categoryBreakdownEl.textContent = "No bets this month.";
      return;
    }

    let sportsCount = 0;
    let horseCount = 0;
    let parlayCount = 0;
    let straightCount = 0;
    let multiHorseCount = 0;

    monthBets.forEach(b => {
      if (b.kind === "sports") {
        sportsCount++;
        if (b.mode === "parlay") parlayCount++;
        else straightCount++;
      } else {
        horseCount++;
        if (b.mode === "multi") multiHorseCount++;
      }
    });

    categoryBreakdownEl.innerHTML = `
      <strong>Sports bets:</strong> ${sportsCount} (Straight: ${straightCount}, Parlays: ${parlayCount})<br>
      <strong>Horse bets:</strong> ${horseCount} (Multi‑race: ${multiHorseCount})
    `;
  }

  // ---------- INIT ----------
  buildCalendar();
  loadNotesForDay();
  renderROI();
  renderTable();
  renderMonthlySummary();
  renderWeeklySummary();
  renderStreaks();
  renderCategoryBreakdown();
  renderBankroll();
});
