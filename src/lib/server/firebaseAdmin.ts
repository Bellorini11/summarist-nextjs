import { cert, getApps, initializeApp, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminApp() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encoded) throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is missing");
  if (getApps().length) return getApp();
  const credentials = JSON.parse(
    Buffer.from(encoded, "base64").toString("utf8"),
  );
  return initializeApp({ credential: cert(credentials) });
}
export function adminAuth() {
  return getAuth(adminApp());
}
export function adminDb() {
  return getFirestore(adminApp());
}
