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

    const q = query(familyProfilesCol, where("uid", "==", uid), where("householdId", "==", householdId));
    const snap = await getDocs(q);
    if (!snap.empty) return { success: true };

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
export async function ensurePersonalHousehold(uid) {
  try {
    const householdsCol = collection(db, "households");
    const q = query(householdsCol, where("ownerId", "==", uid), where("type", "==", "personal"));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // Create new personal household
    const docRef = await addDoc(householdsCol, {
      name: "My Household",
      ownerId: uid,
      members: [{ uid }],
      type: "personal",
      createdAt: serverTimestamp(),
    });

    // Add to family_profiles
    await addUserToFamilyProfile(uid, docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("Error ensuring personal household:", error);
    throw error;
  }
}

/**
 * Create a custom household
 */
export async function createHousehold({ name, ownerUid, profileId = null }) {
  try {
    const householdsCol = collection(db, "households");
    const docRef = await addDoc(householdsCol, {
      name,
      ownerUid,
      members: [{ uid: ownerUid }],
      type: "custom",
      createdAt: serverTimestamp(),
    });

    await addUserToFamilyProfile(ownerUid, docRef.id);

    if (profileId) {
      await updateDoc(doc(db, "profiles", profileId), { householdId: docRef.id });
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
 * Remove a user from a household
 */
export async function removeUserFromHousehold(uid, householdId) {
  try {
    const householdRef = doc(db, "households", householdId);
    const snap = await getDoc(householdRef);
    if (!snap.exists()) return { success: false, error: "Household not found" };

    const household = snap.data();

    // Prevent removing if user is the only member
    if ((household.members || []).length <= 1 && household.members[0]?.uid === uid) {
      return { success: false, error: "You may not leave your only household" };
    }

    const updatedMembers = (household.members || []).filter(m => m.uid !== uid);
    await updateDoc(householdRef, { members: updatedMembers });

    // Create a new personal household for the removed user
    const personalHouseholdId = await ensurePersonalHousehold(uid);

    const profilesCol = collection(db, "profiles");
    const q = query(profilesCol, where("uid", "==", uid));
    const snapProfiles = await getDocs(q);
    if (!snapProfiles.empty) {
      await updateDoc(snapProfiles.docs[0].ref, { householdId: personalHouseholdId });
    }

    await addUserToFamilyProfile(uid, personalHouseholdId);

    return { success: true, newHouseholdId: personalHouseholdId };
  } catch (error) {
    console.error("Error removing user from household:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a household by ID
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
 * Get members of a household
 */
export async function getHouseholdMembers(householdId) {
  try {
    const household = await getHousehold(householdId);
    if (!household || !Array.isArray(household.members)) return [];

    return household.members.map(m => m.uid).filter(Boolean);
  } catch (error) {
    console.error("Error getting household members:", error);
    return [];
  }
}

/**
 * Generate or get permanent invite code for a household
 */
export async function getOrCreateHouseholdInviteCode(householdId) {
  try {
    const householdRef = doc(db, "households", householdId);
    const snap = await getDoc(householdRef);
    if (!snap.exists()) return { success: false, error: "Household not found" };

    const household = snap.data();
    if (household.inviteCode) return { success: true, code: household.inviteCode };

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await updateDoc(householdRef, { inviteCode: code, inviteCodeCreatedAt: serverTimestamp() });

    return { success: true, code };
  } catch (error) {
    console.error("Error generating household invite code:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate one-time invite code
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

      if (household.inviteCode === code || household.invites?.some(i => i.code === code)) {
        if ((household.members || []).some(m => m.uid === uid)) {
          return { success: false, error: "Already a member" };
        }

        const householdRef = doc(db, "households", householdDoc.id);
        const updateMembers = [...(household.members || []), { uid }];
        await updateDoc(householdRef, { members: updateMembers });
        await addUserToFamilyProfile(uid, householdDoc.id);

        const profilesCol = collection(db, "profiles");
        const q = query(profilesCol, where("uid", "==", uid));
        const snap = await getDocs(q);
        let profileData = null;
        if (!snap.empty) {
          const profileRef = snap.docs[0].ref;
          await updateDoc(profileRef, { householdId: householdDoc.id });
          profileData = { id: profileRef.id, ...snap.docs[0].data(), householdId: householdDoc.id };
        }

        return { success: true, householdId: householdDoc.id, newMember: profileData };
      }
    }

    return { success: false, error: "Invalid or expired code" };
  } catch (error) {
    console.error("Error accepting invite code:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all household invites
 */
export async function getHouseholdInvites(householdId) {
  try {
    const invitesCol = collection(db, `households/${householdId}/invites`);
    const snap = await getDocs(invitesCol);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting household invites:", error);
    return [];
  }
}