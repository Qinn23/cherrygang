// lib/households.js
import { db } from "@/firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Add user to family_profiles collection (links user to household)
 */
export async function addUserToFamilyProfile(uid, householdId) {
  try {
    const familyProfilesCol = collection(db, "family_profiles");
    await addDoc(familyProfilesCol, {
      uid,
      householdId,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding to family_profiles:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Ensure personal household exists for a user (create if none)
 */
export async function ensurePersonalHousehold(userId) {
  try {
    const householdsCol = collection(db, "households");
    const q = query(
      householdsCol,
      where("ownerId", "==", userId),
      where("type", "==", "personal")
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // Create new personal household
    const docRef = await addDoc(householdsCol, {
      name: "My Household",
      ownerId: userId,
      members: [{ uid: userId }],
      type: "personal",
      createdAt: serverTimestamp(),
    });

    // Also add to family_profiles
    await addUserToFamilyProfile(userId, docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("Error ensuring personal household:", error);
    throw error;
  }
}

/**
 * Get household by ID
 */
export async function getHousehold(householdId) {
  try {
    const ref = doc(db, "households", householdId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.error("Error getting household:", error);
    return null;
  }
}

/**
 * Get user's household ID via family_profiles
 */
export async function getUserHousehold(uid) {
  try {
    const familyProfilesCol = collection(db, "family_profiles");
    const q = query(familyProfilesCol, where("uid", "==", uid));
    const snap = await getDocs(q);

    if (snap.empty) return null;

    const familyProfile = snap.docs[0].data();
    return familyProfile.householdId;
  } catch (error) {
    console.error("Error getting user household:", error);
    return null;
  }
}

/**
 * Get members of a household with their profiles
 */
export async function getHouseholdMembers(householdId) {
  try {
    const household = await getHousehold(householdId);
    if (!household || !household.members) return [];

    const members = [];
    for (const m of household.members) {
      const uid = m.uid;
      const familyProfilesCol = collection(db, "family_profiles");
      const q = query(familyProfilesCol, where("uid", "==", uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        members.push({
          uid,
          householdId: snap.docs[0].data().householdId,
        });
      }
    }
    return members;
  } catch (error) {
    console.error("Error getting household members:", error);
    return [];
  }
}

/**
 * Create household and link owner
 */
export async function createHousehold({ name, ownerUid, profileId = null }) {
  try {
    const householdsCol = collection(db, "households");
    const docRef = await addDoc(householdsCol, {
      name,
      ownerUid,
      members: [{ uid: ownerUid }],
      createdAt: serverTimestamp(),
    });

    await addUserToFamilyProfile(ownerUid, docRef.id);

    if (profileId) {
      await updateDoc(doc(db, "profiles", profileId), {
        householdId: docRef.id,
      });
    } else {
      const profilesCol = collection(db, "profiles");
      const q = query(profilesCol, where("uid", "==", ownerUid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { householdId: docRef.id });
      }
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating household:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate permanent invite code for household
 */
export async function getOrCreateHouseholdInviteCode(householdId) {
  try {
    const householdRef = doc(db, "households", householdId);
    const snap = await getDoc(householdRef);
    if (!snap.exists()) return { success: false, error: "Household not found" };

    const household = snap.data();
    if (household.inviteCode) return { success: true, code: household.inviteCode };

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await updateDoc(householdRef, {
      inviteCode: code,
      inviteCodeCreatedAt: serverTimestamp(),
    });

    return { success: true, code };
  } catch (error) {
    console.error("Error generating household invite code:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate one-time invite code for household
 */
export async function generateInviteCode(householdId, createdBy) {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const invitesCol = collection(db, `households/${householdId}/invites`);
    await addDoc(invitesCol, {
      code,
      createdBy,
      used: false,
      usedBy: null,
      createdAt: serverTimestamp(),
      usedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    return { success: true, code };
  } catch (error) {
    console.error("Error generating invite code:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Accept an invite code
 */
export async function acceptInviteCode(code, uid) {
  try {
    const householdsSnap = await getDocs(collection(db, "households"));
    for (const householdDoc of householdsSnap.docs) {
      const household = householdDoc.data();

      // Permanent code match
      if (household.inviteCode === code) {
        if (household.members.some((m) => m.uid === uid)) {
          return { success: false, error: "Already a member" };
        }

        const householdRef = doc(db, "households", householdDoc.id);
        const updateMembers = [...(household.members || []), { uid }];
        await updateDoc(householdRef, { members: updateMembers });
        await addUserToFamilyProfile(uid, householdDoc.id);

        const profilesCol = collection(db, "profiles");
        const q = query(profilesCol, where("uid", "==", uid));
        const snap = await getDocs(q);
        if (!snap.empty) await updateDoc(snap.docs[0].ref, { householdId: householdDoc.id });

        return { success: true, householdId: householdDoc.id };
      }

      // One-time invites
      const invitesCol = collection(db, `households/${householdDoc.id}/invites`);
      const invitesSnap = await getDocs(invitesCol);
      for (const inviteDoc of invitesSnap.docs) {
        const invite = inviteDoc.data();
        if (invite.code === code && !invite.used && (!invite.expiresAt || new Date(invite.expiresAt.toDate()) > new Date())) {
          if (household.members.some((m) => m.uid === uid)) {
            return { success: false, error: "Already a member" };
          }
          const householdRef = doc(db, "households", householdDoc.id);
          const updateMembers = [...(household.members || []), { uid }];
          await updateDoc(householdRef, { members: updateMembers });
          await updateDoc(inviteDoc.ref, { used: true, usedBy: uid, usedAt: serverTimestamp() });
          await addUserToFamilyProfile(uid, householdDoc.id);

          const profilesCol = collection(db, "profiles");
          const q2 = query(profilesCol, where("uid", "==", uid));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) await updateDoc(snap2.docs[0].ref, { householdId: householdDoc.id });

          return { success: true, householdId: householdDoc.id };
        }
      }
    }
    return { success: false, error: "Invalid or expired code" };
  } catch (error) {
    console.error("Error accepting invite code:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all invites for a household
 */
export async function getHouseholdInvites(householdId) {
  try {
    const invitesCol = collection(db, `households/${householdId}/invites`);
    const snap = await getDocs(invitesCol);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting household invites:", error);
    return [];
  }
}