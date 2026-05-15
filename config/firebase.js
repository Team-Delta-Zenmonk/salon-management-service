const admin = require("firebase-admin");

try {
  if (process.env.FIREBASE_CREDENTIALS) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase initialized with credentials");
  } else {
    admin.initializeApp();
    console.log("Firebase initialized with default credentials");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

module.exports = admin;
