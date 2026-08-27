// ====================================================
// IMAM TRAVEL PANEL - LIVE FIREBASE DATABASE ENGINE
// ====================================================

let db = null;
let currentEditPackageId = null;
let adminPackagesRef = null;
let heldBookingsRef = null;
let adminListsRef = null;
let adminPackagesTimerId = null;
let heldBookingsTimerId = null;
const packageCache = {};
const bookingCache = {};
const agentMap = {};

function updateAgentMap(dataNode) {
  if (!dataNode || typeof dataNode !== "object") return;

  const traverse = (node, path = "") => {
    if (!node || typeof node !== "object") return;

    const hasLogin =
      node.username || node.name || node.displayName || node.fullName;
    const fullId = path;
    const shortId = path.includes("/") ? path.split("/").pop() : path;

    if (hasLogin && fullId) {
      const displayName =
        node.name ||
        node.displayName ||
        node.fullName ||
        node.username ||
        fullId;
      agentMap[fullId] = displayName;
      if (shortId && shortId !== fullId) {
        agentMap[shortId] = displayName;
      }
      if (node.id) {
        agentMap[node.id] = displayName;
      }
    }

    Object.keys(node).forEach((key) => {
      traverse(node[key], path ? `${path}/${key}` : key);
    });
  };

  traverse(dataNode);
}

function resolveAgentDisplayName(agentId) {
  if (!agentId) return "";
  return agentMap[agentId] || agentMap[String(agentId)] || "";
}

function getCurrentAgentId() {
  if (typeof sessionStorage === "undefined") return "";
  try {
    const currentUser = JSON.parse(
      sessionStorage.getItem("currentUser") || "null",
    );
    if (!currentUser) return "";
    return String(
      currentUser.id || currentUser.username || currentUser.agentId || "",
    ).trim();
  } catch (error) {
    return "";
  }
}

function normalizeAgentId(agentId) {
  if (!agentId) return "";
  return String(agentId).trim();
}

function getAgentRootId(agentId) {
  const normalized = normalizeAgentId(agentId);
  if (!normalized) return "";
  return normalized.split("/")[0];
}

function isMatchingAgentId(bookingAgentId, currentAgentId) {
  const bookingId = normalizeAgentId(bookingAgentId);
  const currentId = normalizeAgentId(currentAgentId);
  if (!bookingId || !currentId) return false;
  if (bookingId === currentId) return true;

  const bookingRoot = getAgentRootId(bookingId);
  const currentRoot = getAgentRootId(currentId);
  if (bookingRoot && currentRoot && bookingRoot === currentRoot) return true;
  return false;
}

const adminFirebaseConfig = {
  apiKey: "AIzaSyCEkpq_ui4cI9n8gMcHUVYAAsEfYmvVB1E",
  authDomain: "imam-travel-website.firebaseapp.com",
  databaseURL:
    "https://imam-travel-website-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "imam-travel-website",
  storageBucket: "imam-travel-website.firebasestorage.app",
  messagingSenderId: "210252978503",
  appId: "1:210252178503:web:4cbae2ad6abc94f95a9462",
  measurementId: "G-HL3KDRKPZ1",
};

// Global hotel lists reused across admin UI
const MAKKAH_HOTELS = [
  "WEDAM SIX",
  "WHITE LION",
  "MASARAT KHALIL / NADA HIJRA",
  "SAIF AL MAJD",
  "MASARAT GOLDEN",
  "BADAR MASA",
  "TARA ZAHBI (OLD-MAJD AL ZAHABI HOTEL)",
  "ARAFAT ZAHBI",
  "FAKHIR AL AZIZIA",
  "SNOOD HOTEL",
  "TAJ FIDDI HOTEL",
  "THAT HOTEL",
  "AL KISWAH TOWERS",
  "MIAAD AL MAJD",
  "LAND PREMIUM",
  "RUKAN AL ZAWIA",
  "MELLA 1",
  "MELLA 2",
  "DIWAN AL BAIT",
  "AREEJ AL ZAHBI",
  "ARFAT GOLDEN RUSHD (OLD DAR AL KHALIL AL RUSHD)",
  "BADAR AL MASA",
  "SHAMS AL ZAHBI",
  "DAIF AJYAD",
  "AREEJ AL WAFA",
  "NAWARA SHAMS 3",
  "LOLO AL FALAH",
  "TIME RUBA",
  "PARK INN",
];

const MADINAH_HOTELS = [
  "QADAT AL DYAFAH / AFAQ AL MASI",
  "HAMOUDA AL MASI",
  "HAMOUDA NEBRAS SILVER",
  "HAMOUDA NEBRAS 1&2 (OLD BURJ HAKEEM)",
  "MUKHTARA DIAMOND",
  "ANSAR GOLDEN TULIP",
  "HALA TAIBAH",
  "MANAZIL MARJAN",
  "MARINA ZAHBI / JODH MARJAN",
  "DIYAR AL SAFA (OLD SAFA CENTER)",
  "WAHAT AL SHARK",
  "ESSA KARIM HOTEL",
  "ANWAR AL AWALI",
  "MANAZIL MAJD",
  "MAJD SILVER",
  "NAJOOM AL MADINAH",
  "BURJ MUWADDAH",
  "BURJ MUKHTARA",
  "ERGWAN AL MADINAH",
  "TAIF NEBRAS",
  "ERGWAN AL SALAM",
  "MARJAN GOLDEN",
  "RAMA AL MADINAH",
  "SAFWAT AL MADINAH",
];

function getHotelName(hotel) {
  if (!hotel) return "";
  return typeof hotel === "string" ? hotel : hotel.name || "";
}

function getHotelDistance(hotel) {
  if (!hotel || typeof hotel === "string") return "";
  return hotel.distance != null ? String(hotel.distance) : "";
}

function normalizeHotelItem(item) {
  if (!item) return { name: "", distance: "" };
  if (typeof item === "string") return { name: item, distance: "" };
  return {
    name: item.name || "",
    distance: item.distance != null ? String(item.distance) : "",
  };
}

window.adminPackagePage = true;
const VENDORS = [];
const AIRLINES = [];
const BAGGAGE_OPTIONS = [];

function normalizeBaggageOption(item) {
  if (!item) {
    return { name: "", oneSideKg: null, twoSideKg: null };
  }
  if (typeof item === "string") {
    return { name: item, oneSideKg: null, twoSideKg: null };
  }

  const oneSideRaw =
    item.oneSideKg != null
      ? item.oneSideKg
      : item.oneSide != null
        ? item.oneSide
        : item.weightOne != null
          ? item.weightOne
          : null;
  const twoSideRaw =
    item.twoSideKg != null
      ? item.twoSideKg
      : item.twoSide != null
        ? item.twoSide
        : item.weightTwo != null
          ? item.weightTwo
          : null;

  const oneSide = Number(oneSideRaw);
  const twoSide = Number(twoSideRaw);

  return {
    name: item.name || item.label || "",
    oneSideKg: Number.isFinite(oneSide) ? oneSide : null,
    twoSideKg: Number.isFinite(twoSide) ? twoSide : null,
  };
}

function formatBaggageOptionLabel(option) {
  if (!option || !option.name) return "Unnamed baggage";
  const parts = [];
  if (option.oneSideKg != null) parts.push(`${option.oneSideKg} KG One Side`);
  if (option.twoSideKg != null) parts.push(`${option.twoSideKg} KG Two Side`);
  return `${option.name}${parts.length ? " — " + parts.join(" / ") : ""}`;
}

function findBaggageOptionIndex(detail) {
  if (!detail || !detail.name) return -1;
  return BAGGAGE_OPTIONS.findIndex((option) => {
    if (option.name !== detail.name) return false;
    if (detail.oneSideKg != null && option.oneSideKg !== detail.oneSideKg) {
      return false;
    }
    if (detail.twoSideKg != null && option.twoSideKg !== detail.twoSideKg) {
      return false;
    }
    return true;
  });
}

function attachAdminDataListener() {
  if (!db) return;

  if (adminListsRef) {
    adminListsRef.off();
    adminListsRef = null;
  }

  adminListsRef = db.ref("admin_data");
  adminListsRef.on("value", (snapshot) => {
    const data = snapshot.val() || {};

    if (data.hotels && Array.isArray(data.hotels.makkah)) {
      MAKKAH_HOTELS.splice(
        0,
        MAKKAH_HOTELS.length,
        ...data.hotels.makkah.map(normalizeHotelItem),
      );
    }
    if (data.hotels && Array.isArray(data.hotels.madinah)) {
      MADINAH_HOTELS.splice(
        0,
        MADINAH_HOTELS.length,
        ...data.hotels.madinah.map(normalizeHotelItem),
      );
    }
    if (Array.isArray(data.vendors)) {
      VENDORS.splice(0, VENDORS.length, ...data.vendors);
    }
    if (data.airlines) {
      const airlinesData = Array.isArray(data.airlines)
        ? data.airlines
        : typeof data.airlines === "object" && data.airlines !== null
          ? Object.values(data.airlines)
          : [];
      AIRLINES.splice(
        0,
        AIRLINES.length,
        ...airlinesData
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean),
      );
    }
    if (Array.isArray(data.baggage)) {
      BAGGAGE_OPTIONS.splice(
        0,
        BAGGAGE_OPTIONS.length,
        ...data.baggage.map(normalizeBaggageOption),
      );
    }

    if (typeof window.renderHotelLists === "function") {
      window.renderHotelLists();
    }
    if (typeof window.renderVendorList === "function") {
      window.renderVendorList();
    }
    if (typeof window.renderAirlineList === "function") {
      window.renderAirlineList();
    }
    if (typeof window.renderPackageAirlineOptions === "function") {
      window.renderPackageAirlineOptions();
    }
    if (typeof window.renderPackageVendorOptions === "function") {
      window.renderPackageVendorOptions();
    }
    if (typeof window.renderPackageBaggageOptions === "function") {
      window.renderPackageBaggageOptions();
    }
    if (typeof window.renderBaggageList === "function") {
      window.renderBaggageList();
    }
    if (typeof window.generateHotelPricingMatrix === "function") {
      window.generateHotelPricingMatrix();
    }
  });
}

function saveHotelData() {
  if (!db) return;
  db.ref("admin_data/hotels")
    .set({ makkah: MAKKAH_HOTELS, madinah: MADINAH_HOTELS })
    .catch((error) => {
      console.error("Hotel data save failed:", error);
    });
}

function saveVendorData() {
  if (!db) return;
  db.ref("admin_data/vendors")
    .set(VENDORS)
    .catch((error) => {
      console.error("Vendor data save failed:", error);
    });
}

function saveAirlineData() {
  if (!db) return;
  db.ref("admin_data/airlines")
    .set(AIRLINES)
    .catch((error) => {
      console.error("Airline data save failed:", error);
    });
}

function saveBaggageData() {
  if (!db) return;
  db.ref("admin_data/baggage")
    .set(BAGGAGE_OPTIONS)
    .catch((error) => {
      console.error("Baggage data save failed:", error);
    });
}

function initAdminActionsModalControls() {
  const overlay = document.getElementById("admin-actions-modal-overlay");
  const openBtn = document.getElementById("btn-open-admin-actions");
  const closeTop = document.getElementById("btn-close-admin-actions-modal");
  const closeBottom = document.getElementById(
    "btn-close-admin-actions-modal-bottom",
  );
  const btnVendor = document.getElementById("btn-open-vendor-from-actions");
  const btnHotel = document.getElementById("btn-open-hotel-from-actions");
  const btnAirline = document.getElementById("btn-open-airline-from-actions");
  const btnBaggage = document.getElementById("btn-open-baggage-from-actions");

  function open() {
    if (overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeTop) closeTop.addEventListener("click", close);
  if (closeBottom) closeBottom.addEventListener("click", close);

  if (btnVendor) {
    btnVendor.addEventListener("click", () => {
      close();
      if (typeof window.openVendorModal === "function") {
        window.openVendorModal();
      }
    });
  }

  if (btnHotel) {
    btnHotel.addEventListener("click", () => {
      close();
      if (typeof window.openHotelModal === "function") {
        window.openHotelModal();
      }
    });
  }

  if (btnAirline) {
    btnAirline.addEventListener("click", () => {
      close();
      if (typeof window.openAirlineModal === "function") {
        window.openAirlineModal();
      }
    });
  }

  if (btnBaggage) {
    btnBaggage.addEventListener("click", () => {
      close();
      if (typeof window.openBaggageModal === "function") {
        window.openBaggageModal();
      }
    });
  }
}

function initAirlineModalControls() {
  const overlay = document.getElementById("airline-modal-overlay");
  const openBtn = document.getElementById("btn-open-airline-modal");
  const closeTop = document.getElementById("btn-close-airline-modal");
  const closeBottom = document.getElementById("btn-close-airline-modal-bottom");

  function open() {
    renderAirlineList();
    if (overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  window.openAirlineModal = open;
  window.closeAirlineModal = close;

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeTop) closeTop.addEventListener("click", close);
  if (closeBottom) closeBottom.addEventListener("click", close);

  function renderAirlineList() {
    const airlineList = document.getElementById("airline-list");
    if (!airlineList) return;

    airlineList.innerHTML = AIRLINES.map(
      (airline, index) => `
        <li style="padding:8px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <span style="flex:1;padding-right:12px">${airline}</span>
          <span style="display:flex;gap:8px">
            <button onclick="editAirline(${index})" style="padding:6px 8px;border-radius:6px;border:1px solid #0f172a;background:#fff;color:#0f172a;cursor:pointer">Edit</button>
            <button onclick="deleteAirline(${index})" style="padding:6px 8px;border-radius:6px;border:1px solid var(--primary-red);background:var(--primary-red);color:#fff;cursor:pointer">Del</button>
          </span>
        </li>
      `,
    ).join("");
  }

  window.renderAirlineList = renderAirlineList;

  window.editAirline = function (index) {
    if (typeof index !== "number" || index < 0 || index >= AIRLINES.length)
      return;
    const airlineList = document.getElementById("airline-list");
    if (!airlineList) return;

    renderAirlineList();
    const li = airlineList.children[index];
    if (!li) return;

    const input = document.createElement("input");
    input.type = "text";
    input.value = AIRLINES[index];
    input.style.padding = "6px 8px";
    input.style.flex = "1";
    input.style.marginRight = "8px";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.style.padding = "6px 8px";
    saveBtn.style.borderRadius = "6px";
    saveBtn.style.cursor = "pointer";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.padding = "6px 8px";
    cancelBtn.style.borderRadius = "6px";
    cancelBtn.style.cursor = "pointer";

    li.innerHTML = "";
    const leftSpan = document.createElement("div");
    leftSpan.style.display = "flex";
    leftSpan.style.alignItems = "center";
    leftSpan.style.gap = "8px";
    leftSpan.appendChild(input);

    const rightSpan = document.createElement("div");
    rightSpan.style.display = "flex";
    rightSpan.style.gap = "8px";
    rightSpan.appendChild(saveBtn);
    rightSpan.appendChild(cancelBtn);

    li.appendChild(leftSpan);
    li.appendChild(rightSpan);
    input.focus();

    saveBtn.addEventListener("click", () => {
      const cleaned = (input.value || "").trim();
      if (!cleaned) {
        alert("Airline name cannot be empty.");
        return;
      }
      const exists = AIRLINES.some(
        (airline, i) =>
          i !== index && airline.toLowerCase() === cleaned.toLowerCase(),
      );
      if (exists) {
        alert("An airline with this name already exists.");
        return;
      }
      AIRLINES[index] = cleaned;
      renderAirlineList();
      saveAirlineData();
      if (typeof window.renderPackageAirlineOptions === "function") {
        window.renderPackageAirlineOptions();
      }
    });

    cancelBtn.addEventListener("click", renderAirlineList);
  };

  window.deleteAirline = function (index) {
    if (typeof index !== "number" || index < 0 || index >= AIRLINES.length)
      return;
    const confirmed = confirm("Are you sure you want to delete this airline?");
    if (!confirmed) return;

    AIRLINES.splice(index, 1);
    renderAirlineList();
    saveAirlineData();
    if (typeof window.renderPackageAirlineOptions === "function") {
      window.renderPackageAirlineOptions();
    }
  };

  const airlineInput = document.getElementById("airline-new-input");
  const btnAddAirline = document.getElementById("btn-add-airline");

  function addAirline(name) {
    const cleaned = (name || "").trim();
    if (!cleaned) {
      alert("Please enter an airline name.");
      return;
    }
    const exists = AIRLINES.some(
      (airline) => airline.toLowerCase() === cleaned.toLowerCase(),
    );
    if (exists) {
      alert("This airline already exists in the list.");
      return;
    }
    AIRLINES.unshift(cleaned);
    renderAirlineList();
    saveAirlineData();
  }

  if (btnAddAirline) {
    btnAddAirline.addEventListener("click", () => {
      addAirline(airlineInput ? airlineInput.value : "");
      if (airlineInput) airlineInput.value = "";
    });
  }
}

function initializeFirebase() {
  if (typeof firebase === "undefined") {
    console.warn("Firebase SDK is not available on this page.");
    return false;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(adminFirebaseConfig);
    }
    db = firebase.database();
    return true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeFirebase();

  try {
    initNavigationRouter();
  } catch (error) {
    console.error("Navigation Routing Error:", error);
  }

  try {
    initModalWindowControls();
  } catch (error) {
    console.error("Modal Controls Error:", error);
  }

  try {
    initAdminActionsModalControls();
  } catch (error) {
    console.error("Admin Actions Modal Error:", error);
  }

  try {
    if (typeof window.initHotelModalControls === "function") {
      window.initHotelModalControls();
    } else {
      setTimeout(() => {
        if (typeof window.initHotelModalControls === "function") {
          window.initHotelModalControls();
        }
      }, 0);
    }
  } catch (error) {
    console.error("Hotel Modal Init Error:", error);
  }

  try {
    if (typeof window.initVendorModalControls === "function") {
      window.initVendorModalControls();
    } else {
      console.error(
        "Vendor Modal Init Error: initVendorModalControls is not defined",
      );
    }
  } catch (error) {
    console.error("Vendor Modal Init Error:", error);
  }

  try {
    initAirlineModalControls();
  } catch (error) {
    console.error("Airline Modal Init Error:", error);
  }

  try {
    if (typeof window.initBaggageModalControls === "function") {
      window.initBaggageModalControls();
    } else {
      console.error(
        "Baggage Modal Init Error: initBaggageModalControls is not defined",
      );
    }
  } catch (error) {
    console.error("Baggage Modal Init Error:", error);
  }

  try {
    attachAdminDataListener();
  } catch (error) {
    console.error("Admin Data Listener Error:", error);
  }

  try {
    generateHotelPricingMatrix();
  } catch (error) {
    console.error("Matrix Generation Error:", error);
  }

  try {
    listenAndRenderAdminPackages();
  } catch (error) {
    console.error("Admin Live View Render Error:", error);
  }

  try {
    listenAndRenderHeldBookings();
  } catch (error) {
    console.error("Held Bookings Render Error:", error);
  }

  try {
    if (document.getElementById("umrah-booking-table-container")) {
      listenAndRenderAgentBookings();
    }
  } catch (error) {
    console.error("Agent Bookings Render Error:", error);
  }
});

function initNavigationRouter() {
  const menuItems = document.querySelectorAll(".sidebar-item");
  const sections = document.querySelectorAll(".page-panel");

  menuItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      const targetID = item.getAttribute("data-target");

      menuItems.forEach((entry) => entry.classList.remove("active"));
      sections.forEach((section) => section.classList.remove("active-panel"));

      item.classList.add("active");
      const targetSection = document.getElementById(targetID);
      if (targetSection) {
        targetSection.classList.add("active-panel");
      }
    });
  });
}

function initModalWindowControls() {
  const overlay = document.getElementById("package-modal-overlay");
  const openButtons = document.querySelectorAll(
    "#btn-open-package-modal, #btn-open-package-modal-inline",
  );
  const closeButtons = document.querySelectorAll(
    "#btn-close-modal-top, #btn-close-modal-bottom",
  );
  const submitBtn = document.getElementById("btn-submit-package");
  const modalTitle = document.querySelector(".modal-header-nav h3");
  const form = document.getElementById("umrah-package-form");

  const resetModalState = () => {
    currentEditPackageId = null;
    if (modalTitle) modalTitle.textContent = "Create Live Umrah Package";
    if (submitBtn)
      submitBtn.innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Save Package';
    if (form) form.reset();
    renderPackageAirlineOptions();
    renderPackageVendorOptions();
    renderPackageBaggageOptions();
    generateHotelPricingMatrix();
  };

  const toggleButtonLoading = (button, isLoading, { label, iconHTML } = {}) => {
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.classList.add("loading");
      button.innerHTML = `
        <span class="loading-spinner" aria-hidden="true"></span>
        ${label || "Please wait..."}
      `;
    } else {
      button.disabled = false;
      button.classList.remove("loading");
      button.innerHTML = `${iconHTML || ""} ${label || "Save Package"}`.trim();
    }
  };

  const renderPackageAirlineOptions = () => {
    const airlineSelect = document.getElementById("pkg-airline");
    if (!airlineSelect) return;

    const options = [
      `<option value="" disabled selected>Select airline</option>`,
      ...(AIRLINES.length
        ? AIRLINES.map(
            (airline) => `<option value="${airline}">${airline}</option>`,
          )
        : [`<option value="" disabled>No airlines available</option>`]),
    ];

    airlineSelect.innerHTML = options.join("");
  };

  window.renderPackageAirlineOptions = renderPackageAirlineOptions;

  const renderPackageVendorOptions = () => {
    const vendorSelect = document.getElementById("pkg-vendor");
    if (!vendorSelect) return;

    const options = [
      `<option value="" disabled selected>Select vendor</option>`,
      ...VENDORS.map(
        (vendor) => `<option value="${vendor}">${vendor}</option>`,
      ),
    ];

    vendorSelect.innerHTML = options.join("");
  };

  window.renderPackageVendorOptions = renderPackageVendorOptions;

  const renderPackageBaggageOptions = () => {
    const outboundSelect = document.getElementById("pkg-baggage-outbound");
    const inboundSelect = document.getElementById("pkg-baggage-inbound");
    if (!outboundSelect || !inboundSelect) return;

    const baggageOptions = BAGGAGE_OPTIONS.length
      ? BAGGAGE_OPTIONS.map(
          (item, index) =>
            `<option value="${index}">${formatBaggageOptionLabel(item)}</option>`,
        )
      : [`<option value="" disabled>No baggage options added</option>`];

    outboundSelect.innerHTML = [
      `<option value="" disabled selected>Select baggage</option>`,
      ...baggageOptions,
    ].join("");

    inboundSelect.innerHTML = [
      `<option value="" disabled selected>Select baggage</option>`,
      ...baggageOptions,
    ].join("");
  };

  window.renderPackageBaggageOptions = renderPackageBaggageOptions;

  const toggleModal = (shouldOpen) => {
    if (!overlay) return;

    if (shouldOpen) {
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    } else {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
      resetModalState();
    }
  };

  const openPackageModal = () => {
    resetModalState();
    toggleModal(true);
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", openPackageModal);
  });

  const inlineOpenButton = document.getElementById(
    "btn-open-package-modal-inline",
  );
  const mainOpenButton = document.getElementById("btn-open-package-modal");
  if (inlineOpenButton)
    inlineOpenButton.addEventListener("click", openPackageModal);
  if (mainOpenButton)
    mainOpenButton.addEventListener("click", openPackageModal);

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => toggleModal(false));
  });

  const addMatrixRowButton = document.getElementById("btn-add-matrix-row");
  if (addMatrixRowButton) {
    addMatrixRowButton.addEventListener("click", () => {
      const tableContainer = document.getElementById("hotel-matrix-rows");
      if (!tableContainer) return;

      const newRow = document.createElement("tr");
      const makkahSelectOptions = MAKKAH_HOTELS.map((hotel) => {
        const hotelName = getHotelName(hotel);
        return `<option value="${hotelName}">${hotelName}</option>`;
      }).join("");

      const madinahSelectOptions = MADINAH_HOTELS.map((hotel) => {
        const hotelName = getHotelName(hotel);
        return `<option value="${hotelName}">${hotelName}</option>`;
      }).join("");

      newRow.innerHTML = `
        <td><select class="makkah-dropdown">${makkahSelectOptions}</select></td>
        <td><select class="madinah-dropdown">${madinahSelectOptions}</select></td>
        <td><input type="number" class="matrix-input-price" placeholder="0" min="0" value=""></td>
        <td><input type="number" class="matrix-input-price" placeholder="0" min="0" value=""></td>
        <td><input type="number" class="matrix-input-price" placeholder="0" min="0" value=""></td>
        <td><input type="number" class="matrix-input-price" placeholder="0" min="0" value=""></td>
        <td><input type="text" class="matrix-input-adjustment" placeholder="+0 or -0" value=""></td>
      `;

      tableContainer.appendChild(newRow);
    });

    const submitPackage = () => {
      if (!db) {
        alert(
          "Firebase is not ready yet. Please refresh the page and try again.",
        );
        return;
      }

      const airline = document.getElementById("pkg-airline").value.trim();
      const airlineNumber = document
        .getElementById("pkg-airline-number")
        .value.trim();
      const outboundSector = document
        .getElementById("pkg-sector-outbound")
        .value.trim();
      const inboundSector = document
        .getElementById("pkg-sector-inbound")
        .value.trim();
      const vendor = document.getElementById("pkg-vendor").value.trim();
      const outboundBaggageValue = document.getElementById(
        "pkg-baggage-outbound",
      ).value;
      const inboundBaggageValue = document.getElementById(
        "pkg-baggage-inbound",
      ).value;
      const outboundBaggageIndex =
        outboundBaggageValue === "" ? -1 : Number(outboundBaggageValue);
      const inboundBaggageIndex =
        inboundBaggageValue === "" ? -1 : Number(inboundBaggageValue);
      const outboundBaggage =
        outboundBaggageIndex >= 0 &&
        outboundBaggageIndex < BAGGAGE_OPTIONS.length
          ? BAGGAGE_OPTIONS[outboundBaggageIndex]
          : { name: "", oneSideKg: null, twoSideKg: null };
      const inboundBaggage =
        inboundBaggageIndex >= 0 && inboundBaggageIndex < BAGGAGE_OPTIONS.length
          ? BAGGAGE_OPTIONS[inboundBaggageIndex]
          : { name: "", oneSideKg: null, twoSideKg: null };
      const deptTime = document.getElementById("pkg-dept-time").value;
      const retTime = document.getElementById("pkg-ret-time").value;
      const seats = document.getElementById("pkg-seats").value.trim();

      if (
        !airline ||
        !vendor ||
        !outboundSector ||
        !inboundSector ||
        !deptTime
      ) {
        alert(
          "Please fill the required route and flight fields before saving.",
        );
        return;
      }

      const matrixRows = [];
      const rows = document.querySelectorAll("#hotel-matrix-rows tr");

      rows.forEach((row) => {
        const makkah = row.querySelector(".makkah-dropdown");
        const madinah = row.querySelector(".madinah-dropdown");
        const inputs = row.querySelectorAll(".matrix-input-price");
        const adjustmentInput = row.querySelector(".matrix-input-adjustment");

        if (!makkah || !madinah || inputs.length < 4) return;

        const selectedMakkah = MAKKAH_HOTELS.find(
          (item) => getHotelName(item) === makkah.value,
        );
        const selectedMadinah = MADINAH_HOTELS.find(
          (item) => getHotelName(item) === madinah.value,
        );

        const parseAdjustment = (value) => {
          if (!value) return 0;
          const raw = String(value).replace(/,/g, "").trim();
          if (/^[+-]?\d+(?:\.\d+)?$/.test(raw)) {
            return Number(raw);
          }
          return 0;
        };

        const adjustment = parseAdjustment(
          adjustmentInput ? adjustmentInput.value : "",
        );
        const sharing = Number(inputs[0].value) || 0;
        const doublePrice = Number(inputs[1].value) || 0;
        const triplePrice = Number(inputs[2].value) || 0;
        const quadPrice = Number(inputs[3].value) || 0;

        matrixRows.push({
          makkahHotel: makkah.value,
          madinahHotel: madinah.value,
          makkahHotelDistance: getHotelDistance(selectedMakkah),
          madinahHotelDistance: getHotelDistance(selectedMadinah),
          sharingPrice: String(sharing + adjustment),
          doublePrice: String(doublePrice + adjustment),
          triplePrice: String(triplePrice + adjustment),
          quadPrice: String(quadPrice + adjustment),
          adjustment: adjustmentInput ? adjustmentInput.value.trim() : "",
        });
      });

      const packageData = {
        airline,
        airlineNumber: airlineNumber || "",
        vendor,
        outboundSector,
        inboundSector,
        baggageOutbound: outboundBaggage.name || "",
        baggageOutboundOneSideKg: outboundBaggage.oneSideKg,
        baggageOutboundTwoSideKg: outboundBaggage.twoSideKg,
        baggageInbound: inboundBaggage.name || "",
        baggageInboundOneSideKg: inboundBaggage.oneSideKg,
        baggageInboundTwoSideKg: inboundBaggage.twoSideKg,
        sector: `${outboundSector} / ${inboundSector}`,
        departureTime: deptTime,
        returnTime: retTime || "Not Configured",
        availableSeats: seats || "Max 40",
        pricingMatrix: matrixRows,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      };

      const isEdit = Boolean(currentEditPackageId);
      const submitLabel = isEdit ? "Update Package" : "Save Package";
      const submitIcon = isEdit
        ? '<i class="fa-solid fa-pen-to-square"></i>'
        : '<i class="fa-solid fa-floppy-disk"></i>';

      if (submitBtn) {
        toggleButtonLoading(submitBtn, true, {
          label: submitLabel,
          iconHTML: submitIcon,
        });
      }

      const action = currentEditPackageId
        ? db.ref("umrah_packages/" + currentEditPackageId).set(packageData)
        : db.ref("umrah_packages").push(packageData);

      window.adminPackageSaveHandlerAttached = true;

      action
        .then(() => {
          if (submitBtn) {
            toggleButtonLoading(submitBtn, false, {
              label: submitLabel,
              iconHTML: submitIcon,
            });
          }
          alert(
            isEdit
              ? "Package updated successfully."
              : "Package saved successfully.",
          );
          toggleModal(false);
        })
        .catch((error) => {
          if (submitBtn) {
            toggleButtonLoading(submitBtn, false, {
              label: submitLabel,
              iconHTML: submitIcon,
            });
          }
          console.error("Firebase Write Error:", error);
          alert("Database sync failed. Please try again.");
        });
    };

    if (submitBtn && !submitBtn.dataset.adminPackageClickBound) {
      submitBtn.addEventListener("click", (event) => {
        event.preventDefault();
        submitPackage();
      });
      submitBtn.dataset.adminPackageClickBound = "true";
    }

    window.editPackageInModal = (packageId) => {
      const pkg = packageCache[packageId];
      if (!pkg || !overlay || !submitBtn || !modalTitle || !form) return;

      currentEditPackageId = packageId;
      modalTitle.textContent = "Edit Umrah Package";
      submitBtn.innerHTML =
        '<i class="fa-solid fa-pen-to-square"></i> Update Package';

      renderPackageAirlineOptions();
      renderPackageVendorOptions();
      document.getElementById("pkg-airline").value = pkg.airline || "";
      document.getElementById("pkg-airline-number").value =
        pkg.airlineNumber || "";
      const fallbackSector = pkg.sector || "";
      let outboundSector = pkg.outboundSector || "";
      let inboundSector = pkg.inboundSector || "";

      if (!outboundSector && fallbackSector) {
        let routeParts = [];

        if (fallbackSector.includes("/")) {
          routeParts = fallbackSector.split(/\s*\/\s*/);
        } else if (fallbackSector.includes(" - ")) {
          routeParts = fallbackSector.split(/\s*-\s*/);
        } else if (fallbackSector.includes("-")) {
          routeParts = fallbackSector.split(/\s*-\s*/);
        }

        outboundSector = outboundSector || routeParts[0] || fallbackSector;
        inboundSector = inboundSector || routeParts[1] || "";

        if (!inboundSector && routeParts.length > 2) {
          inboundSector = routeParts.slice(1).join(" - ");
        }
      }

      document.getElementById("pkg-sector-outbound").value = outboundSector;
      document.getElementById("pkg-sector-inbound").value = inboundSector;
      const outboundIndex = findBaggageOptionIndex({
        name: pkg.baggageOutbound,
        oneSideKg: pkg.baggageOutboundOneSideKg,
        twoSideKg: pkg.baggageOutboundTwoSideKg,
      });
      const inboundIndex = findBaggageOptionIndex({
        name: pkg.baggageInbound,
        oneSideKg: pkg.baggageInboundOneSideKg,
        twoSideKg: pkg.baggageInboundTwoSideKg,
      });

      document.getElementById("pkg-baggage-outbound").value =
        outboundIndex >= 0 ? outboundIndex : "";
      document.getElementById("pkg-baggage-inbound").value =
        inboundIndex >= 0 ? inboundIndex : "";
      document.getElementById("pkg-dept-time").value = pkg.departureTime || "";
      document.getElementById("pkg-ret-time").value =
        pkg.returnTime === "Not Configured" ? "" : pkg.returnTime || "";
      document.getElementById("pkg-seats").value = pkg.availableSeats || "";
      document.getElementById("pkg-vendor").value = pkg.vendor || "";
      renderPackageVendorOptions();
      renderPackageBaggageOptions();
      generateHotelPricingMatrix(pkg.pricingMatrix || []);
      toggleModal(true);
    };
  }

  // Hotel modal controls: show lists from global arrays
  function initHotelModalControls() {
    const overlay = document.getElementById("hotel-modal-overlay");
    const openBtn = document.getElementById("btn-open-hotel-modal");
    const closeTop = document.getElementById("btn-close-hotel-modal");
    const closeBottom = document.getElementById("btn-close-hotel-modal-bottom");

    function open() {
      renderHotelLists();
      if (overlay) overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    function close() {
      if (overlay) overlay.classList.remove("open");
      document.body.style.overflow = "";
    }

    window.openHotelModal = open;
    window.closeHotelModal = close;

    if (openBtn) openBtn.addEventListener("click", open);
    if (closeTop) closeTop.addEventListener("click", close);
    if (closeBottom) closeBottom.addEventListener("click", close);
  }

  window.initHotelModalControls = initHotelModalControls;

  // render lists into modal from global arrays
  function renderHotelLists() {
    const makkahList = document.getElementById("makkah-hotel-list");
    const madinahList = document.getElementById("madinah-hotel-list");

    if (makkahList) {
      makkahList.innerHTML = MAKKAH_HOTELS.map((hotel, i) => {
        const name = getHotelName(hotel);
        const distance = getHotelDistance(hotel);
        return `
        <li style="padding:8px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <span style="flex:1;padding-right:12px">${name}${distance ? ` — ${distance}` : ""}</span>
          <span style="display:flex;gap:8px">
            <button onclick="editHotel('makkah', ${i})" style="padding:6px 8px;border-radius:6px;border:1px solid #0f172a;background:#fff;color:#0f172a;cursor:pointer">Edit</button>
            <button onclick="deleteHotel('makkah', ${i})" style="padding:6px 8px;border-radius:6px;border:1px solid var(--primary-red);background:var(--primary-red);color:#fff;cursor:pointer">Del</button>
          </span>
        </li>
      `;
      }).join("");
    }

    if (madinahList) {
      madinahList.innerHTML = MADINAH_HOTELS.map((hotel, i) => {
        const name = getHotelName(hotel);
        const distance = getHotelDistance(hotel);
        return `
        <li style="padding:8px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <span style="flex:1;padding-right:12px">${name}${distance ? ` — ${distance}` : ""}</span>
          <span style="display:flex;gap:8px">
            <button onclick="editHotel('madinah', ${i})" style="padding:6px 8px;border-radius:6px;border:1px solid #0f172a;background:#fff;color:#0f172a;cursor:pointer">Edit</button>
            <button onclick="deleteHotel('madinah', ${i})" style="padding:6px 8px;border-radius:6px;border:1px solid var(--primary-red);background:var(--primary-red);color:#fff;cursor:pointer">Del</button>
          </span>
        </li>
      `;
      }).join("");
    }

    window.renderHotelLists = renderHotelLists;

    window.editHotel = function (type, index) {
      const list = type === "makkah" ? MAKKAH_HOTELS : MADINAH_HOTELS;
      if (!list || typeof index !== "number") return;

      const containerId =
        type === "makkah" ? "makkah-hotel-list" : "madinah-hotel-list";
      const ul = document.getElementById(containerId);
      if (!ul) return;

      // Prevent multiple simultaneous edits by re-rendering first
      renderHotelLists();

      const li = ul.children[index];
      if (!li) return;

      // Create inline edit UI
      const input = document.createElement("input");
      input.type = "text";
      input.value = getHotelName(list[index]);
      input.style.padding = "6px 8px";
      input.style.flex = "1";
      input.style.marginRight = "8px";

      const distanceInput = document.createElement("input");
      distanceInput.type = "text";
      distanceInput.placeholder = "Distance";
      distanceInput.value = getHotelDistance(list[index]);
      distanceInput.style.padding = "6px 8px";
      distanceInput.style.flex = "1";
      distanceInput.style.marginRight = "8px";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.style.padding = "6px 8px";
      saveBtn.style.borderRadius = "6px";
      saveBtn.style.cursor = "pointer";

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.style.padding = "6px 8px";
      cancelBtn.style.borderRadius = "6px";
      cancelBtn.style.cursor = "pointer";

      // Build edit row
      li.innerHTML = "";
      const leftSpan = document.createElement("div");
      leftSpan.style.display = "flex";
      leftSpan.style.alignItems = "center";
      leftSpan.style.gap = "8px";
      leftSpan.appendChild(input);
      leftSpan.appendChild(distanceInput);

      const rightSpan = document.createElement("div");
      rightSpan.style.display = "flex";
      rightSpan.style.gap = "8px";
      rightSpan.appendChild(saveBtn);
      rightSpan.appendChild(cancelBtn);

      li.appendChild(leftSpan);
      li.appendChild(rightSpan);

      input.focus();

      saveBtn.addEventListener("click", () => {
        const cleaned = (input.value || "").trim();
        const cleanedDistance = (distanceInput.value || "").trim();
        if (!cleaned) {
          alert("Hotel name cannot be empty.");
          return;
        }
        const exists = list.some(
          (item, i) =>
            i !== index &&
            getHotelName(item).toLowerCase() === cleaned.toLowerCase(),
        );
        if (exists) {
          alert("A hotel with this name already exists.");
          return;
        }
        const existing = list[index];
        list[index] =
          typeof existing === "string"
            ? { name: cleaned, distance: cleanedDistance }
            : { name: cleaned, distance: cleanedDistance };
        renderHotelLists();
        saveHotelData();
        try {
          if (typeof generateHotelPricingMatrix === "function")
            generateHotelPricingMatrix();
        } catch (e) {}
      });

      cancelBtn.addEventListener("click", () => {
        renderHotelLists();
      });
    };
  }

  window.deleteHotel = function (type, index) {
    const list = type === "makkah" ? MAKKAH_HOTELS : MADINAH_HOTELS;
    if (!Array.isArray(list) || typeof index !== "number") return;
    if (index < 0 || index >= list.length) return;

    const confirmed = confirm(
      `Are you sure you want to delete this ${type === "makkah" ? "Makkah" : "Madinah"} hotel?`,
    );
    if (!confirmed) return;

    list.splice(index, 1);
    renderHotelLists();
    saveHotelData();
    try {
      if (typeof generateHotelPricingMatrix === "function")
        generateHotelPricingMatrix();
    } catch (e) {
      // ignore
    }
  };

  function normalizeHotelDistanceInput(value) {
    if (value === undefined || value === null) return "";
    const text = String(value).trim();
    const match = text.match(/^-?\d*/);
    return match ? match[0] : "";
  }

  function attachDistanceInputValidation(input) {
    if (!input) return;
    input.addEventListener("input", () => {
      const normalized = normalizeHotelDistanceInput(input.value);
      if (input.value !== normalized) {
        input.value = normalized;
      }
    });
    input.addEventListener("keydown", (event) => {
      const allowed = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "Tab",
      ];
      if (allowed.includes(event.key)) return;
      if (
        event.key === "-" &&
        input.selectionStart === 0 &&
        !input.value.includes("-")
      )
        return;
      if (/^[0-9]$/.test(event.key)) return;
      event.preventDefault();
    });
  }

  // handle add-new inputs inside modal
  const makkahInput = document.getElementById("makkah-new-input");
  const makkahDistanceInput = document.getElementById("makkah-distance-input");
  const btnAddMakkah = document.getElementById("btn-add-makkah");
  const madinahInput = document.getElementById("madinah-new-input");
  const madinahDistanceInput = document.getElementById(
    "madinah-distance-input",
  );
  const btnAddMadinah = document.getElementById("btn-add-madinah");

  function addHotel(type, name, distance) {
    if (!name || !name.trim()) {
      alert("Please enter a hotel name.");
      return;
    }
    const cleaned = name.trim();
    const list = type === "makkah" ? MAKKAH_HOTELS : MADINAH_HOTELS;
    const exists = list.some(
      (item) => getHotelName(item).toLowerCase() === cleaned.toLowerCase(),
    );
    if (exists) {
      alert("This hotel already exists in the list.");
      return;
    }
    const hotelItem =
      distance && distance.trim()
        ? { name: cleaned, distance: distance.trim() }
        : cleaned;
    // add to start of array so it appears on top
    list.unshift(hotelItem);
    renderHotelLists();
    saveHotelData();
    // refresh package form selects if open
    try {
      if (typeof generateHotelPricingMatrix === "function")
        generateHotelPricingMatrix();
    } catch (e) {
      // ignore
    }
  }

  if (btnAddMakkah) {
    btnAddMakkah.addEventListener("click", () => {
      addHotel(
        "makkah",
        makkahInput ? makkahInput.value : "",
        makkahDistanceInput ? makkahDistanceInput.value : "",
      );
      if (makkahInput) makkahInput.value = "";
      if (makkahDistanceInput) makkahDistanceInput.value = "";
    });
  }

  if (btnAddMadinah) {
    btnAddMadinah.addEventListener("click", () => {
      addHotel(
        "madinah",
        madinahInput ? madinahInput.value : "",
        madinahDistanceInput ? madinahDistanceInput.value : "",
      );
      if (madinahInput) madinahInput.value = "";
      if (madinahDistanceInput) madinahDistanceInput.value = "";
    });
  }

  attachDistanceInputValidation(makkahDistanceInput);
  attachDistanceInputValidation(madinahDistanceInput);
}

function initVendorModalControls() {
  const overlay = document.getElementById("vendor-modal-overlay");
  const openBtn = document.getElementById("btn-open-vendor-modal");
  const closeTop = document.getElementById("btn-close-vendor-modal");
  const closeBottom = document.getElementById("btn-close-vendor-modal-bottom");
  const vendorInput = document.getElementById("vendor-new-input");
  const btnAddVendor = document.getElementById("btn-add-vendor");

  function renderVendorList() {
    const vendorList = document.getElementById("vendor-list");
    if (!vendorList) return;

    vendorList.innerHTML = VENDORS.map(
      (vendor, index) => `
        <li style="padding:8px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <span style="flex:1;padding-right:12px">${vendor}</span>
          <span style="display:flex;gap:8px">
            <button onclick="editVendor(${index})" style="padding:6px 8px;border-radius:6px;border:1px solid #0f172a;background:#fff;color:#0f172a;cursor:pointer">Edit</button>
            <button onclick="deleteVendor(${index})" style="padding:6px 8px;border-radius:6px;border:1px solid var(--primary-red);background:var(--primary-red);color:#fff;cursor:pointer">Del</button>
          </span>
        </li>
      `,
    ).join("");
  }

  function addVendor(name) {
    const cleaned = (name || "").trim();
    if (!cleaned) {
      alert("Please enter a vendor name.");
      return;
    }
    const exists = VENDORS.some(
      (vendor) => vendor.toLowerCase() === cleaned.toLowerCase(),
    );
    if (exists) {
      alert("This vendor already exists in the list.");
      return;
    }
    VENDORS.unshift(cleaned);
    saveVendorData();
    renderVendorList();
    if (typeof renderPackageVendorOptions === "function") {
      renderPackageVendorOptions();
    }
  }

  function editVendor(index) {
    if (typeof index !== "number" || index < 0 || index >= VENDORS.length)
      return;
    const vendorList = document.getElementById("vendor-list");
    if (!vendorList) return;

    renderVendorList();
    const li = vendorList.children[index];
    if (!li) return;

    const input = document.createElement("input");
    input.type = "text";
    input.value = VENDORS[index];
    input.style.padding = "6px 8px";
    input.style.flex = "1";
    input.style.marginRight = "8px";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.style.padding = "6px 8px";
    saveBtn.style.borderRadius = "6px";
    saveBtn.style.cursor = "pointer";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.padding = "6px 8px";
    cancelBtn.style.borderRadius = "6px";
    cancelBtn.style.cursor = "pointer";

    li.innerHTML = "";
    const leftSpan = document.createElement("div");
    leftSpan.style.display = "flex";
    leftSpan.style.alignItems = "center";
    leftSpan.style.gap = "8px";
    leftSpan.appendChild(input);

    const rightSpan = document.createElement("div");
    rightSpan.style.display = "flex";
    rightSpan.style.gap = "8px";
    rightSpan.appendChild(saveBtn);
    rightSpan.appendChild(cancelBtn);

    li.appendChild(leftSpan);
    li.appendChild(rightSpan);
    input.focus();

    saveBtn.addEventListener("click", () => {
      const cleaned = (input.value || "").trim();
      if (!cleaned) {
        alert("Vendor name cannot be empty.");
        return;
      }
      const exists = VENDORS.some(
        (vendor, i) =>
          i !== index && vendor.toLowerCase() === cleaned.toLowerCase(),
      );
      if (exists) {
        alert("A vendor with this name already exists.");
        return;
      }
      VENDORS[index] = cleaned;
      saveVendorData();
      renderVendorList();
      if (typeof renderPackageVendorOptions === "function") {
        renderPackageVendorOptions();
      }
    });

    cancelBtn.addEventListener("click", renderVendorList);
  }

  function deleteVendor(index) {
    if (typeof index !== "number" || index < 0 || index >= VENDORS.length)
      return;
    const confirmed = confirm("Delete this vendor?");
    if (!confirmed) return;
    VENDORS.splice(index, 1);
    saveVendorData();
    renderVendorList();
    if (typeof renderPackageVendorOptions === "function") {
      renderPackageVendorOptions();
    }
  }

  function open() {
    renderVendorList();
    if (overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  window.openVendorModal = open;
  window.closeVendorModal = close;
  window.renderVendorList = renderVendorList;
  window.editVendor = editVendor;
  window.deleteVendor = deleteVendor;

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeTop) closeTop.addEventListener("click", close);
  if (closeBottom) closeBottom.addEventListener("click", close);

  if (btnAddVendor) {
    btnAddVendor.addEventListener("click", () => {
      addVendor(vendorInput ? vendorInput.value : "");
      if (vendorInput) vendorInput.value = "";
    });
  }
}

window.initVendorModalControls = initVendorModalControls;

function initBaggageModalControls() {
  const overlay = document.getElementById("baggage-modal-overlay");
  const openBtn = document.getElementById("btn-open-baggage-modal");
  const closeTop = document.getElementById("btn-close-baggage-modal");
  const closeBottom = document.getElementById("btn-close-baggage-modal-bottom");
  const nameInput = document.getElementById("baggage-name-input");
  const oneSideInput = document.getElementById("baggage-one-side-input");
  const twoSideInput = document.getElementById("baggage-two-side-input");
  const addBtn = document.getElementById("btn-add-baggage");

  function open() {
    renderBaggageList();
    if (overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function addBaggage(name, oneSide, twoSide) {
    const cleaned = (name || "").trim();
    if (!cleaned) {
      alert("Please enter a baggage label.");
      return;
    }

    const oneSideKg = Number(oneSide);
    const twoSideKg = Number(twoSide);

    if (!oneSideKg && oneSideKg !== 0 && !twoSideKg && twoSideKg !== 0) {
      alert("Please enter at least one kg value for One side or Two side.");
      return;
    }

    const exists = BAGGAGE_OPTIONS.some(
      (item) => item.name.toLowerCase() === cleaned.toLowerCase(),
    );
    if (exists) {
      alert("This baggage label already exists.");
      return;
    }

    BAGGAGE_OPTIONS.unshift({
      name: cleaned,
      oneSideKg: Number.isFinite(oneSideKg) ? oneSideKg : null,
      twoSideKg: Number.isFinite(twoSideKg) ? twoSideKg : null,
    });
    saveBaggageData();
    renderBaggageList();
  }

  function deleteBaggage(index) {
    if (
      typeof index !== "number" ||
      index < 0 ||
      index >= BAGGAGE_OPTIONS.length
    )
      return;
    const confirmed = confirm("Delete this baggage option?");
    if (!confirmed) return;
    BAGGAGE_OPTIONS.splice(index, 1);
    saveBaggageData();
    renderBaggageList();
  }

  function renderBaggageList() {
    const baggageList = document.getElementById("baggage-list");
    if (!baggageList) return;

    baggageList.innerHTML = BAGGAGE_OPTIONS.map(
      (item, index) => `
        <li style="padding:8px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between;gap:12px">
          <span style="flex:1;padding-right:12px;font-weight:600">${item.name}</span>
          <span style="display:flex;gap:8px;align-items:center">
            <label style="font-size:0.75rem;white-space:nowrap">One Side</label>
            <input type="number" readonly value="${item.oneSideKg != null ? item.oneSideKg : ""}" style="width:72px;padding:6px 8px;border-radius:6px;border:1px solid var(--border-light);background:#f8fafc;text-align:center" />
            <label style="font-size:0.75rem;white-space:nowrap">Two Side</label>
            <input type="number" readonly value="${item.twoSideKg != null ? item.twoSideKg : ""}" style="width:72px;padding:6px 8px;border-radius:6px;border:1px solid var(--border-light);background:#f8fafc;text-align:center" />
            <button onclick="deleteBaggage(${index})" style="padding:6px 8px;border-radius:6px;border:1px solid var(--primary-red);background:var(--primary-red);color:#fff;cursor:pointer">Del</button>
          </span>
        </li>
      `,
    ).join("");
  }

  window.openBaggageModal = open;
  window.closeBaggageModal = close;
  window.renderBaggageList = renderBaggageList;
  window.deleteBaggage = deleteBaggage;

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeTop) closeTop.addEventListener("click", close);
  if (closeBottom) closeBottom.addEventListener("click", close);
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      addBaggage(
        nameInput ? nameInput.value : "",
        oneSideInput ? oneSideInput.value : "",
        twoSideInput ? twoSideInput.value : "",
      );
      if (nameInput) nameInput.value = "";
      if (oneSideInput) oneSideInput.value = "";
      if (twoSideInput) twoSideInput.value = "";
    });
  }
}

function createHotelPricingMatrixRow(rowData = {}) {
  const row = document.createElement("tr");
  const makkahSelectOptions = MAKKAH_HOTELS.map((hotel) => {
    const hotelName = getHotelName(hotel);
    const selected =
      hotelName === getHotelName(rowData.makkahHotel) ? "selected" : "";
    return `<option value="${hotelName}" ${selected}>${hotelName}</option>`;
  }).join("");

  const madinahSelectOptions = MADINAH_HOTELS.map((hotel) => {
    const hotelName = getHotelName(hotel);
    const selected =
      hotelName === getHotelName(rowData.madinahHotel) ? "selected" : "";
    return `<option value="${hotelName}" ${selected}>${hotelName}</option>`;
  }).join("");

  const sharingValue = rowData.sharingPrice || "";
  const doubleValue = rowData.doublePrice || "";
  const tripleValue = rowData.triplePrice || "";
  const quadValue = rowData.quadPrice || "";

  row.innerHTML = `
    <td><select class="makkah-dropdown">${makkahSelectOptions}</select></td>
    <td><select class="madinah-dropdown">${madinahSelectOptions}</select></td>
    <td><input type="number" class="matrix-input-price" placeholder="0" min="0" value="${sharingValue}"></td>
    <td><input type="number" class="matrix-input-price" placeholder="0" min="0" value="${doubleValue}"></td>
    <td><input type="number" class="matrix-input-price" placeholder="0" min="0" value="${tripleValue}"></td>
    <td><input type="number" class="matrix-input-price" placeholder="0" min="0" value="${quadValue}"></td>
    <td><input type="text" class="matrix-input-adjustment" placeholder="+0 or -0" value=""></td>
  `;

  return row;
}

function generateHotelPricingMatrix(existingRows = []) {
  const tableContainer = document.getElementById("hotel-matrix-rows");
  if (!tableContainer) return;

  tableContainer.innerHTML = "";

  for (let i = 0; i < 10; i++) {
    const rowData = existingRows[i] || {};
    tableContainer.appendChild(createHotelPricingMatrixRow(rowData));
  }
}

function updateDashboardSummary(data) {
  const packageCount = data ? Object.keys(data).length : 0;
  const totalSeats = Object.values(data || {}).reduce((sum, pkg) => {
    const seats = Number(String(pkg.availableSeats).replace(/[^0-9]/g, ""));
    return sum + (Number.isNaN(seats) ? 0 : seats);
  }, 0);

  const statPackages = document.getElementById("stat-packages");
  const statPackagesInline = document.getElementById("stat-packages-inline");
  const statSeats = document.getElementById("stat-seats");
  const statSeatsInline = document.getElementById("stat-seats-inline");
  const statUpcoming = document.getElementById("stat-upcoming");

  if (statPackages) statPackages.textContent = packageCount;
  if (statPackagesInline) statPackagesInline.textContent = packageCount;
  if (statSeats) statSeats.textContent = totalSeats;
  if (statSeatsInline) statSeatsInline.textContent = totalSeats;
  if (statUpcoming)
    statUpcoming.textContent = packageCount > 0 ? packageCount : 0;
}

function isPackageExpired(pkg) {
  if (!pkg) return false;

  const availableSeats = Number(
    String(pkg.availableSeats || "").replace(/[^0-9]/g, ""),
  );
  if (!Number.isNaN(availableSeats) && availableSeats === 0) {
    return true;
  }

  const departureTime = String(pkg.departureTime || "").trim();
  if (!departureTime) {
    return false;
  }

  const normalizedDate = departureTime.replace(" ", "T");
  const departureDate = new Date(normalizedDate);
  if (Number.isNaN(departureDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const depDay = new Date(departureDate);
  depDay.setHours(0, 0, 0, 0);

  return depDay <= today;
}

function getPackageDepartureTimestamp(pkg) {
  if (!pkg || !pkg.departureTime) return Infinity;
  const normalizedDate = String(pkg.departureTime).trim().replace(" ", "T");
  const departureDate = new Date(normalizedDate);
  return Number.isNaN(departureDate.getTime())
    ? Infinity
    : departureDate.getTime();
}

function autoRemoveExpiredPackage(packageId) {
  if (!db || !packageId) return;
  db.ref("umrah_packages/" + packageId)
    .remove()
    .catch((error) => {
      console.error("Auto-remove expired package failed:", packageId, error);
    });
}

function listenAndRenderAdminPackages() {
  const displayContainer = document.getElementById("packages-list-card");
  if (!displayContainer) return;

  if (adminPackagesTimerId) {
    clearTimeout(adminPackagesTimerId);
    adminPackagesTimerId = null;
  }

  adminPackagesTimerId = setTimeout(() => {
    adminPackagesTimerId = null;

    if (!db) {
      displayContainer.classList.remove("loading-placeholder");
      displayContainer.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Firebase is not connected right now. Refresh the page once the database is available.</p>
      `;
      return;
    }

    adminPackagesRef = db.ref("umrah_packages");
    adminPackagesRef.on("value", (snapshot) => {
      displayContainer.classList.remove("loading-placeholder");
      const data = snapshot.val();
      updateDashboardSummary(data);

      if (!data) {
        displayContainer.innerHTML = `
          <i class="fa-solid fa-folder-open"></i>
          <p>No packages created yet. Create your first package to start publishing routes.</p>
        `;
        return;
      }

      const packageIds = Object.keys(data);
      packageIds.sort((firstId, secondId) => {
        const firstPkg = data[firstId];
        const secondPkg = data[secondId];
        return (
          getPackageDepartureTimestamp(firstPkg) -
          getPackageDepartureTimestamp(secondPkg)
        );
      });

      let htmlContent = `
        <div class="table-wrapper">
          <table class="package-table">
            <thead>
              <tr>
                <th>Airline</th>
                <th>Sector</th>
                <th>Vendor</th>
                <th>Airline num</th>
                <th>Departure</th>
                <th>Return</th>
                <th>Seats</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
      `;

      packageIds.forEach((id) => {
        const pkg = data[id];
        packageCache[id] = pkg;
        const routeLabel =
          pkg.outboundSector || pkg.inboundSector
            ? (pkg.outboundSector || "—") +
              (pkg.inboundSector ? " / " + pkg.inboundSector : "")
            : pkg.sector || "—";

        if (isPackageExpired(pkg)) {
          autoRemoveExpiredPackage(id);
          return;
        }

        htmlContent += `
          <tr>
            <td class="airline-cell"><i class="fa-solid fa-plane" style="margin-right: 6px;"></i>${pkg.airline}</td>
            <td>${routeLabel}</td>
            <td>${pkg.vendor || "—"}</td>
            <td>${pkg.airlineNumber || "—"}</td>
            <td>${pkg.departureTime ? pkg.departureTime.replace("T", " ") : "—"}</td>
            <td>${pkg.returnTime && pkg.returnTime !== "Not Configured" ? pkg.returnTime.replace("T", " ") : "—"}</td>
            <td><span class="pill">${pkg.availableSeats || "0"}</span></td>
            <td>
              <button class="edit-btn" onclick="editPackageInModal('${id}')" title="Edit package">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="delete-btn" onclick="deletePackageFromFirebase('${id}')" title="Delete package">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </td>
          </tr>
        `;
      });

      htmlContent += `</tbody></table></div>`;
      displayContainer.innerHTML = htmlContent;
    });
  }, 800);
}

window.listenAndRenderAdminPackages = listenAndRenderAdminPackages;

function listenAndRenderHeldBookings() {
  const displayContainer = document.getElementById("bookings-list-card");
  if (!displayContainer) return;

  if (heldBookingsTimerId) {
    clearTimeout(heldBookingsTimerId);
    heldBookingsTimerId = null;
  }

  heldBookingsTimerId = setTimeout(() => {
    heldBookingsTimerId = null;

    if (!db) {
      displayContainer.classList.remove("loading-placeholder");
      displayContainer.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Firebase is not connected right now. Refresh the page once the database is available.</p>
      `;
      return;
    }

    db.ref("users")
      .once("value")
      .then((snapshot) => {
        const users = snapshot.val();
        updateAgentMap(users ? users.agents : {});
      })
      .catch(() => {
        /* ignore agent lookup failures */
      });

    const currentPage = (window.location.pathname || "").toLowerCase();
    const isUmrahPage =
      currentPage.includes("umrah-pack") || currentPage.includes("ummrah");
    const collections = isUmrahPage
      ? ["user_bookings"]
      : ["group_bookings", "group_holdbooking", "user_bookings"];

    Promise.all(
      collections.map((collection) => db.ref(collection).once("value")),
    )
      .then((snapshots) => {
        displayContainer.classList.remove("loading-placeholder");
        const merged = {};
        snapshots.forEach((snapshot) => {
          const data = snapshot.val() || {};
          Object.entries(data).forEach(([id, booking]) => {
            merged[id] = { ...(merged[id] || {}), ...(booking || {}), id };
          });
        });

        const bookings = Object.values(merged).filter((booking) => {
          if (!booking) return false;

          const statusText = String(
            booking.status ||
              booking.bookingStatus ||
              booking.booking_status ||
              "",
          ).toLowerCase();

          const isGroupBookingRecord = Boolean(
            booking.groupName ||
            booking.group ||
            booking.group_id ||
            booking.groupId ||
            booking.packageType === "group" ||
            booking.bookingCategory === "group_booking" ||
            booking.bookingType === "group_booking",
          );

          const hasBookingIdentity = isUmrahPage
            ? Boolean(
                !isGroupBookingRecord &&
                (booking.packageAirline ||
                  booking.packageSector ||
                  booking.firstName ||
                  booking.lastName ||
                  booking.phone ||
                  booking.email ||
                  Array.isArray(booking.passengers)),
              )
            : Boolean(
                booking.groupName ||
                booking.group ||
                booking.group_id ||
                booking.groupId ||
                booking.packageType === "group" ||
                booking.bookingCategory === "group_booking" ||
                booking.bookingType === "group_booking" ||
                booking.packageAirline ||
                booking.packageSector ||
                booking.firstName ||
                booking.lastName ||
                Array.isArray(booking.passengers),
              );

          const isHoldLikeStatus = isUmrahPage
            ? /hold|held|pending|reserved|confirmed|booking confirmed|cancel|cancelled/.test(
                statusText,
              )
            : /hold|held|pending|reserved|confirm|confirmed|cancel|cancelled/.test(
                statusText,
              );

          return (
            hasBookingIdentity &&
            !isGroupBookingRecord &&
            (isHoldLikeStatus ||
              booking.isHold === true ||
              booking.hold === true ||
              booking.held === true)
          );
        });

        if (!bookings.length) {
          displayContainer.innerHTML = `
            <i class="fa-solid fa-folder-open"></i>
            <p>${isUmrahPage ? "No held Umrah bookings found." : "No held group bookings yet. Once a group booking is placed on hold, entries will appear here."}</p>
          `;
          return;
        }

        let htmlContent = `
          <div class="table-wrapper">
            <table class="package-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Airline</th>
                  <th>Contact</th>
                  <th>Departure</th>
                  <th>Status</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
        `;

        bookings.forEach((booking) => {
          const id = booking.id || "";
          bookingCache[id] = booking;
          const customerName =
            `${booking.firstName || ""} ${booking.lastName || ""}`.trim() ||
            "Guest";
          const agentId =
            booking.agentId ||
            booking.agent_id ||
            booking.agentID ||
            booking.agent;
          const agentName =
            booking.agentName ||
            booking.agent_name ||
            booking.agentFullName ||
            booking.agentDisplayName;
          const displayAgent =
            agentName || resolveAgentDisplayName(agentId) || customerName;
          const airline = booking.packageAirline || booking.airline || "—";
          const contact =
            booking.phone || booking.email || booking.vendor || "—";
          const departure = booking.departureTime
            ? new Date(booking.departureTime).toLocaleString()
            : booking.departureDate ||
              booking.departure_time ||
              booking.departure ||
              "—";

          htmlContent += `
            <tr>
              <td>${displayAgent}</td>
              <td>${airline}</td>
              <td>${contact}</td>
              <td>${departure}</td>
              <td>${booking.status || booking.bookingStatus || "Hold"}</td>
              <td>
                <button class="view-btn" onclick="showBookingDetails('${id}')" title="View booking details">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </td>
            </tr>
          `;
        });

        htmlContent += `</tbody></table></div>`;
        displayContainer.innerHTML = htmlContent;
      })
      .catch((error) => {
        console.error("Failed to load group hold bookings:", error);
        displayContainer.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Unable to load held group bookings.</p>
        `;
      });
  }, 800);
}

function listenAndRenderAgentBookings() {
  const pageName = (
    window.location && window.location.href ? window.location.href : ""
  ).toLowerCase();
  const isHoldGroupPage =
    /agent_viewholdgroupbooking|admin_viewholdgroupbooking/i.test(pageName);

  if (isHoldGroupPage) {
    return;
  }

  const displayContainer = document.getElementById(
    "umrah-booking-table-container",
  );
  if (!displayContainer) return;

  const currentAgentId = getCurrentAgentId();
  if (!currentAgentId) {
    displayContainer.innerHTML = `
      <div class="table-empty" style="padding: 28px; text-align: center; color: #64748b;">
        No active agent session found. Please log in again.
      </div>
    `;
    return;
  }

  if (heldBookingsTimerId) {
    clearTimeout(heldBookingsTimerId);
    heldBookingsTimerId = null;
  }

  heldBookingsTimerId = setTimeout(() => {
    heldBookingsTimerId = null;

    if (!db) {
      displayContainer.innerHTML = `
        <div class="table-empty" style="padding: 28px; text-align: center; color: #64748b;">
          Firebase is not connected right now. Refresh the page once the database is available.
        </div>
      `;
      return;
    }

    db.ref("users")
      .once("value")
      .then((snapshot) => {
        const users = snapshot.val();
        updateAgentMap(users ? users.agents : {});
      })
      .catch(() => {
        /* ignore agent lookup failures */
      });

    db.ref("user_bookings")
      .once("value")
      .then((snapshot) => {
        const data = snapshot.val() || {};
        const bookings = Object.entries(data).filter(([id, booking]) => {
          const record = booking || {};
          const bookingAgentId =
            record.agentId ||
            record.agent_id ||
            record.agentID ||
            record.agent ||
            "";
          return isMatchingAgentId(bookingAgentId, currentAgentId);
        });

        if (!bookings.length) {
          displayContainer.innerHTML = `
            <div class="table-empty" style="padding: 28px; text-align: center; color: #64748b;">
              No Umrah bookings found for your agent account.
            </div>
          `;
          return;
        }

        let htmlContent = `
          <div class="table-wrapper">
            <table class="w-100 umrah-list-table">
              <thead>
                <tr>
                  <th class="text-nowrap">DATE</th>
                  <th class="text-nowrap">AGENCY NAME</th>
                  <th class="text-nowrap">AGENT ID</th>
                  <th class="text-nowrap">PASSENGER NAME</th>
                  <th class="text-nowrap">ROUTE</th>
                  <th class="text-nowrap">PKG TYPE</th>
                  <th class="text-nowrap text-center">NO OF PAX</th>
                  <th class="text-nowrap">HOTEL DETAILS</th>
                  <th class="text-nowrap">OUTBOUND DATE</th>
                  <th class="text-nowrap">VOUCHER#</th>
                  <th class="text-nowrap text-left">VISA STATUS</th>
                  <th class="text-nowrap text-left">BOOKING STATUS</th>
                  <th class="text-nowrap text-center action-col">ACTION</th>
                </tr>
              </thead>
              <tbody>
        `;

        bookings.forEach(([id, booking]) => {
          const record = booking || {};
          const bookingAgentId =
            record.agentId ||
            record.agent_id ||
            record.agentID ||
            record.agent ||
            "";
          bookingCache[id] = record;
          const passengerName = (() => {
            if (Array.isArray(record.passengers) && record.passengers.length) {
              const firstPassenger = record.passengers[0] || {};
              const nameParts = [
                firstPassenger.travellerTitle ||
                  firstPassenger.travelerTitle ||
                  firstPassenger.title,
                firstPassenger.travellerFirstName ||
                  firstPassenger.firstName ||
                  firstPassenger.name ||
                  firstPassenger.fullName,
                firstPassenger.travellerLastName ||
                  firstPassenger.lastName ||
                  "",
              ].filter(Boolean);
              return (
                nameParts.join(" ") ||
                firstPassenger.name ||
                firstPassenger.fullName ||
                firstPassenger.username ||
                ""
              );
            }
            const singleNameParts = [
              record.travellerTitle || record.travelerTitle || record.title,
              record.travellerFirstName ||
                record.firstName ||
                record.name ||
                record.fullName,
              record.travellerLastName || record.lastName || "",
            ].filter(Boolean);
            return singleNameParts.join(" ") || "";
          })();
          const bookingAgencyName =
            record.agentName ||
            record.agent_name ||
            record.agentFullName ||
            record.agentDisplayName ||
            record.agencyName ||
            record.agency_name ||
            record.agency ||
            resolveAgentDisplayName(bookingAgentId) ||
            "—";
          const packageName =
            record.packageSector ||
            record.packageName ||
            record.package_name ||
            record.package ||
            record.packageAirline ||
            record.sector ||
            "—";
          const packageType =
            record.roomType ||
            record.packageType ||
            record.package_type ||
            record.pkgType ||
            "—";
          const paxCount =
            record.passengerCount ||
            record.pax ||
            record.noOfPax ||
            record.no_of_pax ||
            record.adults ||
            (Array.isArray(record.passengers)
              ? record.passengers.length
              : "—") ||
            "—";
          const hotelDetailsParts = [];
          if (record.makkahHotel) {
            hotelDetailsParts.push(`Makkah: ${record.makkahHotel}`);
          }
          if (record.madinahHotel) {
            hotelDetailsParts.push(`Madina: ${record.madinahHotel}`);
          }
          const hotelDetails =
            hotelDetailsParts.join(" | ") ||
            record.hotelDetails ||
            record.hotel_details ||
            record.hotel ||
            "—";
          const outboundDate =
            record.departureTime ||
            record.outboundDate ||
            record.outbound_date ||
            record.departureDate ||
            record.departure_date ||
            "—";
          const voucher =
            record.voucher ||
            record.voucherNumber ||
            record.voucher_no ||
            record.voucherNo ||
            id ||
            "—";
          const visaStatus =
            record.visaStatus || record.visa_status || record.visa || "—";
          const bookingStatus =
            record.bookingStatus ||
            record.booking_status ||
            record.status ||
            "—";
          const normalizedStatus = String(bookingStatus || "")
            .trim()
            .toLowerCase();
          const isConfirmedStatus = /confirm|confirmed|approved/.test(
            normalizedStatus,
          );
          const voucherDisplay = isConfirmedStatus ? safeText(voucher) : "—";
          const detailsLink = (() => {
            const explicitLink =
              record.detailsUrl ||
              record.bookingUrl ||
              record.url ||
              record.link;
            if (explicitLink) return explicitLink;
            return `agent_viewbooking.html?bookingId=${encodeURIComponent(id)}`;
          })();
          const bookingDateValue =
            record.timestamp ||
            record.createdAt ||
            record.holdDate ||
            record.hold_at ||
            record.bookingDate ||
            record.booking_date ||
            record.date ||
            "—";
          const bookingDate = (() => {
            const rawValue = String(bookingDateValue).trim();
            if (!rawValue || rawValue === "—") return "—";

            const numericValue = Number(rawValue);
            const parsedDate = Number.isFinite(numericValue)
              ? new Date(numericValue)
              : new Date(rawValue);

            if (Number.isNaN(parsedDate.getTime())) {
              return rawValue;
            }

            return parsedDate.toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          })();

          htmlContent += `
            <tr>
              <td class="td-truncate">${safeText(bookingDate)}</td>
              <td class="td-truncate">${safeText(bookingAgencyName)}</td>
              <td class="td-truncate">${safeText(bookingAgentId)}</td>
              <td class="td-truncate">${safeText(passengerName)}</td>
              <td class="text-dark-474747 font-medium td-truncate">${safeText(packageName)}</td>
              <td class="td-truncate">${safeText(packageType)}</td>
              <td class="text-center font-bold">${safeText(paxCount)}</td>
              <td>${safeText(hotelDetails)}</td>
              <td><div class="hotel-line">${safeText(outboundDate)}</div></td>
              <td>
                <div class="hotel-line font-bold">${voucherDisplay}</div>
              </td>
              <td class="text-left">${safeText(visaStatus)}</td>
              <td class="text-left">${safeText(bookingStatus)}</td>
              <td class="text-center action-col">
                <div class="d-inline-flex align-items-center gap-2">
                  <a
                    href="${safeText(detailsLink)}"
                    class="action-btn action-btn--view"
                    title="Open Booking"
                  ><i class="bi bi-eye"></i></a>
                </div>
              </td>
            </tr>
          `;
        });

        htmlContent += `</tbody></table></div>`;
        displayContainer.innerHTML = htmlContent;
      })
      .catch((error) => {
        console.error("Failed to load agent group bookings:", error);
        displayContainer.innerHTML = `
          <div class="table-empty" style="padding: 28px; text-align: center; color: #d32f2f;">
            Unable to load group bookings for this agent.
          </div>
        `;
      });
  }, 800);
}

function cleanupFirebaseConnections() {
  if (adminPackagesTimerId) {
    clearTimeout(adminPackagesTimerId);
    adminPackagesTimerId = null;
  }
  if (heldBookingsTimerId) {
    clearTimeout(heldBookingsTimerId);
    heldBookingsTimerId = null;
  }

  if (typeof firebase === "undefined" || !firebase.apps.length) return;

  try {
    if (adminPackagesRef) {
      adminPackagesRef.off();
      adminPackagesRef = null;
    }
    if (heldBookingsRef) {
      heldBookingsRef.off();
      heldBookingsRef = null;
    }
    if (adminListsRef) {
      adminListsRef.off();
      adminListsRef = null;
    }

    const database = firebase.database();
    if (database && typeof database.goOffline === "function") {
      database.goOffline();
    }
  } catch (error) {
    console.warn("Firebase cleanup failed:", error);
  }
}

window.addEventListener("pagehide", cleanupFirebaseConnections, {
  capture: true,
});
window.addEventListener("freeze", cleanupFirebaseConnections, {
  capture: true,
});

function restoreFirebaseConnections() {
  if (typeof firebase === "undefined" || !firebase.apps.length) return;

  try {
    const database = firebase.database();
    if (database && typeof database.goOnline === "function") {
      database.goOnline();
    }
  } catch (error) {
    console.warn("Firebase restore failed:", error);
  }
}

window.addEventListener("pageshow", function (event) {
  if (!event.persisted) return;
  restoreFirebaseConnections();
});
window.addEventListener("resume", function () {
  restoreFirebaseConnections();
});

function safeText(value) {
  if (value === null || value === undefined) return "—";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildBookingDetailsHtml(booking) {
  const agentId =
    booking.agentId ||
    booking.agent_id ||
    booking.agentID ||
    booking.agent ||
    "";
  const agentName =
    booking.agentName ||
    booking.agent_name ||
    booking.agentFullName ||
    booking.agentDisplayName ||
    resolveAgentDisplayName(agentId) ||
    "—";
  const customerName =
    `${booking.firstName || ""} ${booking.lastName || ""}`.trim() || "Guest";

  const detailEntries = {
    Agent: agentName,
    "Agent ID": agentId || "—",
    Customer: customerName,
    Email: booking.email || "—",
    Phone: booking.phone || "—",
    "Package Airline": booking.packageAirline || "—",
    "Package Vendor": booking.packageVendor || booking.vendor || "—",
    "Package Sector": booking.packageSector || "—",
    "Outbound Sector": booking.packageOutboundSector || "—",
    "Inbound Sector": booking.packageInboundSector || "—",
    "Departure Time": booking.departureTime || "—",
    "Return Time": booking.returnTime || "—",
    "Room Type": booking.roomType || "—",
    Passengers: booking.passengerCount || "—",
    "Selected Price": booking.selectedPrice || "—",
    "Total Fare": booking.totalFare || "—",
    Status: booking.status || "—",
    Remarks: booking.remarks || "—",
    "Saved By": booking.savedBy || "—",
    "Saved From": booking.sourcePage || "—",
    "Booking Timestamp": booking.timestamp || "—",
  };

  let html = `<div class="booking-details-grid">`;
  Object.entries(detailEntries).forEach(([label, value]) => {
    html += `
      <div class="detail-row">
        <div class="detail-label">${safeText(label)}</div>
        <div class="detail-value">${safeText(value)}</div>
      </div>
    `;
  });

  const extraKeys = Object.keys(booking).filter(
    (key) =>
      ![
        "agentId",
        "agent_id",
        "agentID",
        "agent",
        "agentName",
        "agent_name",
        "agentFullName",
        "agentDisplayName",
        "firstName",
        "lastName",
        "email",
        "phone",
        "packageAirline",
        "packageSector",
        "packageOutboundSector",
        "packageInboundSector",
        "departureTime",
        "returnTime",
        "roomType",
        "passengerCount",
        "selectedPrice",
        "totalFare",
        "status",
        "remarks",
        "savedBy",
        "sourcePage",
        "timestamp",
      ].includes(key),
  );

  if (extraKeys.length) {
    html += `<div class="detail-section-heading">Other stored values</div>`;
    extraKeys.forEach((key) => {
      html += `
        <div class="detail-row">
          <div class="detail-label">${safeText(key)}</div>
          <div class="detail-value">${safeText(booking[key])}</div>
        </div>
      `;
    });
  }

  html += `</div>`;
  return html;
}

window.showBookingDetails = function (bookingId) {
  if (!bookingId) return;

  let targetPage = "admin_viewbooking.html";
  try {
    const currentUser = JSON.parse(
      sessionStorage.getItem("currentUser") || "null",
    );
    const isAgent =
      currentUser &&
      (currentUser.type === "agent" ||
        currentUser.type === "worker" ||
        String(currentUser.id || "").includes("/"));
    if (isAgent) {
      targetPage = "agent_viewbooking.html";
    }
  } catch (error) {
    // fallback to admin view if session data cannot be parsed
  }

  window.location.href = `${targetPage}?bookingId=${encodeURIComponent(
    bookingId,
  )}`;
};

window.closeBookingDetailsModal = function () {
  const overlay = document.getElementById("booking-details-overlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
};

window.deletePackageFromFirebase = function (packageID) {
  if (!db) {
    alert("Firebase is not available right now.");
    return;
  }

  if (confirm("Delete this package permanently from the database?")) {
    db.ref("umrah_packages/" + packageID)
      .remove()
      .then(() => alert("Package deleted successfully."))
      .catch((error) => {
        console.error("Deletion error:", error);
      });
  }
};
