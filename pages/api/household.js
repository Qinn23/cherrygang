import { auth } from "@/firebase";

import {
  createHousehold,
  generateInviteCode,
  acceptInviteCode,
  getHousehold,
  getHouseholdMembers,
  getHouseholdInvites,
} from "@/lib/households";

/**
 * API route for household management
 * 
 * POST /api/household
 *   ?action=create -> Create new household (requires: name)
 *   ?action=generateCode -> Generate invite code (requires: householdId)
 *   ?action=acceptCode -> Accept invite code (requires: code)
 *   ?action=getHousehold -> Get household details (requires: householdId)
 *   ?action=getMembers -> Get household members (requires: householdId)
 *   ?action=getInvites -> Get household invites (requires: householdId)
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action } = req.query;

  try {
    // Get current user (simplified - in prod use proper auth middleware)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    let uid;
    try {
      const decodedToken = await auth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    switch (action) {
      case "create":
        return handleCreateHousehold(req, res, uid);
      case "generateCode":
        return handleGenerateCode(req, res, uid);
      case "acceptCode":
        return handleAcceptCode(req, res, uid);
      case "getHousehold":
        return handleGetHousehold(req, res);
      case "getMembers":
        return handleGetMembers(req, res);
      case "getInvites":
        return handleGetInvites(req, res, uid);
      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    console.error("Household API error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleCreateHousehold(req, res, uid) {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Missing name" });
  }
  const result = await createHousehold({ name, ownerUid: uid });
  return res.status(result.success ? 200 : 500).json(result);
}

async function handleGenerateCode(req, res, uid) {
  const { householdId } = req.body;
  if (!householdId) {
    return res.status(400).json({ error: "Missing householdId" });
  }

  // Verify user is a member of this household
  const household = await getHousehold(householdId);
  if (!household || !household.members.some(m => m.uid === uid)) {
    return res.status(403).json({ error: "Not a member of this household" });
  }

  const result = await generateInviteCode(householdId, uid);
  return res.status(result.success ? 200 : 500).json(result);
}

async function handleAcceptCode(req, res, uid) {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }
  const result = await acceptInviteCode(code, uid);
  return res.status(result.success ? 200 : 500).json(result);
}

async function handleGetHousehold(req, res) {
  const { householdId } = req.body;
  if (!householdId) {
    return res.status(400).json({ error: "Missing householdId" });
  }
  const household = await getHousehold(householdId);
  return res
    .status(household ? 200 : 404)
    .json(household ? { success: true, household } : { error: "Household not found" });
}

async function handleGetMembers(req, res) {
  const { householdId } = req.body;
  if (!householdId) {
    return res.status(400).json({ error: "Missing householdId" });
  }
  const members = await getHouseholdMembers(householdId);
  return res.status(200).json({ success: true, members });
}

async function handleGetInvites(req, res, uid) {
  const { householdId } = req.body;
  if (!householdId) {
    return res.status(400).json({ error: "Missing householdId" });
  }

  // Verify user is owner or member
  const household = await getHousehold(householdId);
  if (!household || !household.members.some(m => m.uid === uid)) {
    return res.status(403).json({ error: "Not a member of this household" });
  }

  const invites = await getHouseholdInvites(householdId);
  return res.status(200).json({ success: true, invites });
}
