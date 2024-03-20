// const admin = require("firebase-admin");
import admin from "firebase-admin";

// const secretAccessKey = require("./firebase-credential.json");
import firebaseSecret from "./firebase-credential.json" assert { type: "json" };
admin.initializeApp({
  credential: admin.credential.cert(firebaseSecret),
});

const verifyFirebaseToken = async (tokenKey) => {
  try {
    const decodeValue = await admin.auth().verifyIdToken(tokenKey);
    if (decodeValue) {
      return decodeValue;
    }

    return "UnAuthorize";
  } catch (e) {
    console.log("verify firebase token error", e);
    return e;
  }
};
export { verifyFirebaseToken };
