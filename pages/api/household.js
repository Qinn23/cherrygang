// pages/api/household.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import adminAuth from "../../lib/firebaseAdmin"; // Firebase Admin SDK
import { removeUserFromHousehold } from "@/lib/households";

import {
  ensurePersonalHousehold,
  createHousehold,
  generateInviteCode,
  acceptInviteCode,
  getHousehold,
  getHouseholdMembers,
  getHouseholdInvites,
} from "@/lib/households";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action } = req.query;

    // ----------------------------
    // VERIFY TOKEN WITH ADMIN SDK
    // ----------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    let uid;

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;

      // Optional: ensure user has a personal household
      if (action === "create" || action === "acceptCode") {
        await ensurePersonalHousehold(uid);
      }
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ error: "Your login session has expired. Please log in again." });
    }

    // ----------------------------
    // ACTION ROUTING
    // ----------------------------
    switch (action) {
      case "create":
        return await handleCreateHousehold(req, res, uid);
      case "generateCode":
        return await handleGenerateCode(req, res, uid);
      case "acceptCode":
        return await handleAcceptCode(req, res, uid);
      case "getHousehold":
        return await handleGetHousehold(req, res);
      case "getMembers":
        return await handleGetMembers(req, res);
      case "getInvites":
        return await handleGetInvites(req, res, uid);
        case "removeMember":
        return await handleRemoveMember(req, res, uid);
      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    console.error("Household API error:", error);
return res.status(500).json({ error: "An unexpected error occurred. Please try again.", success: false });
  }
}

// ------------------------
// HANDLER FUNCTIONS
// ------------------------

async function handleCreateHousehold(req, res, uid) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Missing name" });

  const result = await createHousehold({ name, ownerUid: uid });
  return res.status(result.success ? 200 : 500).json(result);
}

async function handleGenerateCode(req, res, uid) {
  const { householdId } = req.body;
  if (!householdId) return res.status(400).json({ error: "Missing householdId" });

  const household = await getHousehold(householdId);
  if (!household || !household.members.some(m => m.uid === uid)) {
    return res.status(403).json({ error: "Not a member of this household" });
  }

  const result = await generateInviteCode(householdId, uid);
  return res.status(result.success ? 200 : 500).json(result);
}

async function handleRemoveMember(req, res, loggedInUid) {
  const { memberUid, householdId } = req.body;
  if (!memberUid || !householdId) return res.status(400).json({ error: "Missing parameters" });

  const household = await getHousehold(householdId);
  if (!household || !household.members.some(m => m.uid === loggedInUid)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const result = await removeUserFromHousehold(memberUid, householdId);
  return res.status(result.success ? 200 : 500).json(result);
}

async function handleAcceptCode(req, res, uid) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Missing code" });

  const result = await acceptInviteCode(code, uid);

  if (result.success) {
    // Fetch the new member profile to return immediately
    const profilesCol = collection(db, "profiles");
    const q = query(profilesCol, where("uid", "==", uid));
    const snap = await getDocs(q);
    let newMember = null;
    if (!snap.empty) newMember = { id: snap.docs[0].id, ...snap.docs[0].data() };

    return res.status(200).json({ ...result, newMember });
  }

  return res.status(400).json(result);
}

async function handleGetHousehold(req, res) {
  const { householdId } = req.body;
  if (!householdId) return res.status(400).json({ error: "Missing householdId" });

  const household = await getHousehold(householdId);
  return res.status(household ? 200 : 404).json(
    household ? { success: true, household } : { error: "Household not found" }
  );
}

async function handleGetMembers(req, res) {
  const { householdId } = req.body;
  if (!householdId) return res.status(400).json({ error: "Missing householdId" });

  const members = await getHouseholdMembers(householdId);
  return res.status(200).json({ success: true, members });
}

async function handleGetInvites(req, res, uid) {
  const { householdId } = req.body;
  if (!householdId) return res.status(400).json({ error: "Missing householdId" });

  const household = await getHousehold(householdId);
  if (!household || !household.members.some(m => m.uid === uid)) {
    return res.status(403).json({ error: "Not a member of this household" });
  }

  const invites = await getHouseholdInvites(householdId);
  return res.status(200).json({ success: true, invites });
}