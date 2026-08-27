// ============================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ============================================

// This script initializes Firebase using the global SDK (v8.10.1)
// which is loaded from CDN in your HTML files

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEkpq_ui4cI9n8gMcHUVYAAsEfYmvVB1E",
  authDomain: "imam-travel-website.firebaseapp.com",
  databaseURL:
    "https://imam-travel-website-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "imam-travel-website",
  storageBucket: "imam-travel-website.firebasestorage.app",
  messagingSenderId: "210252978503",
  appId: "1:210252978503:web:4cbae2ad6abc94f95a9462",
  measurementId: "G-HL3KDRKPZ1",
};

// Initialize Firebase using the global firebase object
// (This assumes firebase-app.js and firebase-database.js are loaded from CDN)
if (typeof firebase !== "undefined") {
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } else {
    console.log(
      "Firebase already initialized. Skipping duplicate initialization.",
    );
  }
} else {
  console.warn(
    "Firebase SDK not loaded. Make sure firebase CDN scripts are included in your HTML.",
  );
}

const firebaseRestRoot = firebaseConfig.databaseURL.replace(/\/+$/, "");

function getFirebaseRestUrl(path = "") {
  const trimmed = String(path || "").replace(/^\/+|\/+$/g, "");
  return `${firebaseRestRoot}/${trimmed}.json`;
}

async function firebaseDbRestRequest(path, method = "GET", body = null) {
  const url = getFirebaseRestUrl(path);
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Firebase REST ${method} failed: ${response.status} ${text}`,
    );
  }
  return response.json();
}

function firebaseDbPushRest(path, data) {
  return firebaseDbRestRequest(path, "POST", data);
}

function firebaseDbSetRest(path, data) {
  return firebaseDbRestRequest(path, "PUT", data);
}

function firebaseDbGetRest(path) {
  return firebaseDbRestRequest(path, "GET");
}

function firebaseDbDeleteRest(path) {
  return firebaseDbRestRequest(path, "DELETE");
}

window.firebaseRestDb = {
  push: firebaseDbPushRest,
  set: firebaseDbSetRest,
  get: firebaseDbGetRest,
  delete: firebaseDbDeleteRest,
};
