document.addEventListener("DOMContentLoaded", () => {
  // ===== DOM ELEMENTS =====
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
  const weeklyComparisonEl = document.getElementById("weeklyComparison");
  const streakSummaryEl = document.getElementById("streakSummary");
  const categoryBreakdownEl = document.getElementById("categoryBreakdown");

  const dayNotesEl = document.getElementById("dayNotes");
  const saveNotesBtn = document.getElementById("saveNotes");

  const startingBankrollInput = document.getElementById("startingBankroll");
  const saveBankrollBtn = document.getElementById("saveBankroll");
  const bankrollSummaryEl = document.getElementById("bankrollSummary");

  // ===== STATE =====
  let bets = JSON.parse(localStorage.getItem("bets_v3")) || [];
  let notes = JSON.parse(localStorage.getItem("notes_v1")) || {};
  let bankroll = JSON.parse(localStorage.getItem("bankroll_v1")) || { starting: 0 };

  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();
  let selectedDate = formatDate(today);

  selectedDateLabel.textContent = `Bets for ${selectedDate}`;
  startingBankrollInput.value = bankroll.starting || 0;

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

  // ===== HELPERS =====
  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatDateFromParts(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function parseDateStr(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function getWeekKey(dateStr) {
    const d = parseDateStr(dateStr);
    const tmp = new Date(d.getTime());
    tmp.setHours(0, 0, 0, 0);
    const day = (tmp.getDay() + 6) % 7; // Monday-based
    tmp.setDate(tmp.getDate() - day);
    const year = tmp.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const week = Math.floor(((tmp - oneJan) / 86400000 + oneJan.getDay() + 1) / 7) + 1;
    return `${year}-W${String(week).padStart(2, "0")}`;
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

  // ===== CALENDAR =====
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
    refreshAll();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    refreshAll();
  });

  function refreshAll() {
    buildCalendar();
    renderROI();
    renderTable();
    renderMonthlySummary();
    renderWeeklySummary();
    renderStreaks();
    renderCategoryBreakdown();
    renderBankroll();
  }

  // ===== TABS =====
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const tab = btn.dataset.tab;
      sportsForm.style.display = tab === "sports" ? "block" : "none";
      horseForm.style.display = tab === "horses" ? "block" : "none";
    });
  });

  // ===== SPORTS FORM =====
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
    refreshAll();

    sportsForm.reset();
    legsContainer.innerHTML = "";
    legsSection.style.display = "none";
  });

  // ===== HORSE FORM =====
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
    refreshAll();

    horseForm.reset();
    multiRaceContainer.innerHTML = "";
  });

  // ===== FILTERS & EXPORT =====
  kindFilter.addEventListener("change", renderTable);
  resultFilter.addEventListener("change", renderTable);

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
        b.stake.toFixed(2),
        b.payout.toFixed(2),
        profit.toFixed(2),
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

  // ===== NOTES =====
  function loadNotesForDay() {
    dayNotesEl.value = notes[selectedDate] || "";
  }

  saveNotesBtn.addEventListener("click", () => {
    notes[selectedDate] = dayNotesEl.value;
    saveNotes();
  });

  // ===== BANKROLL =====
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

  // ===== DAILY ROI =====
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
    const roiClass = totalProfit >= 0 ? "roi-green" : "roi-red";

    roiOutput.innerHTML =
      `<strong>Daily ROI:</strong> <span class="${roiClass}">${roi.toFixed(2)}%</span> (${sign}$${totalProfit.toFixed(2)})`;
  }

  // ===== TABLE =====
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

    dayBets.forEach(b => {
      const tr = document.createElement("tr");

      const profit = b.payout - b.stake;
      const sign = profit >= 0 ? "+" : "";
      const profitClass = profit >= 0 ? "roi-green" : "roi-red";

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

      tr.innerHTML = `
        <td>${b.kind}</td>
        <td>${details}</td>
        <td>$${b.stake.toFixed(2)}</td>
        <td>$${b.payout.toFixed(2)}</td>
        <td class="${profitClass}">${sign}$${profit.toFixed(2)}</td>
        <td><button class="delete-btn" data-id="${b.id}">X</button></td>
      `;

      betTable.appendChild(tr);
    });

    betTable.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        bets = bets.filter(b => b.id !== id);
        saveBets();
        refreshAll();
      });
    });
  }

  // ===== MONTHLY SUMMARY =====
  function renderMonthlySummary() {
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const yearStr = String(currentYear);

    const monthBets = bets.filter(b => b.date.startsWith(`${yearStr}-${monthStr}`));
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
    const roiClass = totalProfit >= 0 ? "roi-green" : "roi-red";

    monthlySummaryEl.innerHTML = `
      <strong>Bets:</strong> ${monthBets.length}<br>
      <strong>Stake:</strong> $${totalStake.toFixed(2)}<br>
      <strong>Profit:</strong> <span class="${roiClass}">${sign}$${totalProfit.toFixed(2)}</span><br>
      <strong>Monthly ROI:</strong> <span class="${roiClass}">${roi.toFixed(2)}%</span>
    `;
  }

  // ===== WEEKLY SUMMARY & COMPARISON =====
  function renderWeeklySummary() {
    const todayStr = formatDate(today);
    const thisWeekKey = getWeekKey(todayStr);

    const weekBets = bets.filter(b => getWeekKey(b.date) === thisWeekKey);

    if (weekBets.length === 0) {
      weeklySummaryEl.textContent = "No bets this week.";
      weeklyComparisonEl.textContent = "";
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
    const roiClass = roi >= 0 ? "roi-green" : "roi-red";

    weeklySummaryEl.innerHTML = `
      <strong>Bets this week:</strong> ${weekBets.length}<br>
      <strong>Stake:</strong> $${totalStake.toFixed(2)}<br>
      <strong>Profit:</strong> <span class="${roiClass}">${sign}$${totalProfit.toFixed(2)}</span><br>
      <strong>Weekly ROI:</strong> <span class="${roiClass}">${roi.toFixed(2)}%</span>
    `;

    renderWeeklyComparison(roi);
  }

  function renderWeeklyComparison(thisWeekROI) {
    const todayStr = formatDate(today);
    const thisWeekKey = getWeekKey(todayStr);

    const d = parseDateStr(todayStr);
    d.setDate(d.getDate() - 7);
    const lastWeekKey = getWeekKey(formatDate(d));

    const lastWeekBets = bets.filter(b => getWeekKey(b.date) === lastWeekKey);

    if (lastWeekBets.length === 0) {
      weeklyComparisonEl.textContent = "No data for last week.";
      return;
    }

    let stake = 0;
    let profit = 0;

    lastWeekBets.forEach(b => {
      stake += b.stake;
      profit += b.payout - b.stake;
    });

    const lastWeekROI = stake === 0 ? 0 : (profit / stake) * 100;

    const diff = thisWeekROI - lastWeekROI;
    const diffSign = diff >= 0 ? "+" : "";
    const diffClass = diff >= 0 ? "roi-green" : "roi-red";

    weeklyComparisonEl.innerHTML = `
      <strong>This Week vs Last Week:</strong>
      <span class="${diffClass}">${diffSign}${diff.toFixed(2)}%</span>
    `;
  }

  // ===== STREAKS (simple version) =====
  function renderStreaks() {
    if (bets.length === 0) {
      streakSummaryEl.textContent = "No bets yet.";
      return;
    }

    const sorted = [...bets].sort((a, b) => a.date.localeCompare(b.date));

    let currentStreak = 0;
    let bestStreak = 0;

    sorted.forEach(b => {
      const profit = b.payout - b.stake;
      if (profit > 0) {
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    streakSummaryEl.innerHTML = `
      <strong>Current Winning Streak:</strong> ${currentStreak} days<br>
      <strong>Best Winning Streak:</strong> ${bestStreak} days
    `;
  }

  // ===== CATEGORY BREAKDOWN (monthly) =====
  function renderCategoryBreakdown() {
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const yearStr = String(currentYear);

    const monthBets = bets.filter(b => b.date.startsWith(`${yearStr}-${monthStr}`));
    if (monthBets.length === 0) {
      categoryBreakdownEl.textContent = "No bets this month.";
      return;
    }

    const map = {};

    monthBets.forEach(b => {
      if (b.kind === "sports") {
        if (b.mode === "straight") {
          const key = "Straight";
          if (!map[key]) map[key] = { stake: 0, profit: 0 };
          map[key].stake += b.stake;
          map[key].profit += b.payout - b.stake;
        } else {
          (b.legs || []).forEach(leg => {
            const key = leg.category || "Other";
            if (!map[key]) map[key] = { stake: 0, profit: 0 };
            map[key].stake += b.stake / (b.legs.length || 1);
            map[key].profit += (b.payout - b.stake) / (b.legs.length || 1);
          });
        }
      } else {
        const key = b.mode === "single" ? (b.type || "Horses") : "Horses – Multi";
        if (!map[key]) map[key] = { stake: 0, profit: 0 };
        map[key].stake += b.stake;
        map[key].profit += b.payout - b.stake;
      }
    });

    let html = "<table><thead><tr><th>Category</th><th>Stake</th><th>Profit</th><th>ROI</th></tr></thead><tbody>";

    Object.keys(map).forEach(cat => {
      const s = map[cat].stake;
      const p = map[cat].profit;
      const roi = s === 0 ? 0 : (p / s) * 100;
      const sign = p >= 0 ? "+" : "";
      const cls = p >= 0 ? "roi-green" : "roi-red";

      html += `
        <tr>
          <td>${cat}</td>
          <td>$${s.toFixed(2)}</td>
          <td class="${cls}">${sign}$${p.toFixed(2)}</td>
          <td class="${cls}">${roi.toFixed(2)}%</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    categoryBreakdownEl.innerHTML = html;
  }

  // ===== INIT =====
  loadNotesForDay();
  refreshAll();
});
