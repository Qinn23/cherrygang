import { db } from "@/firebase";
import { collection, doc, addDoc, getDoc, updateDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

/**
 * Get or create a permanent (multi-use, non-expiring) invite code for a household
 */
export async function getOrCreateHouseholdInviteCode(householdId) {
  try {
    const householdRef = doc(db, "households", householdId);
    const householdSnap = await getDoc(householdRef);
    
    if (!householdSnap.exists()) {
      return { success: false, error: "Household not found" };
    }

    const household = householdSnap.data();
    
    // If household already has an invite code, return it
    if (household.inviteCode) {
      return { success: true, code: household.inviteCode };
    }

    // Generate a 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Store it on the household doc
    await updateDoc(householdRef, {
      inviteCode: code,
      inviteCodeCreatedAt: serverTimestamp(),
    });

    return { success: true, code };
  } catch (error) {
    console.error("Error getting/creating household invite code:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new household with an owner
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

    // Add entry to family_profiles to link owner to household
    await addUserToFamilyProfile(ownerUid, docRef.id);

    // Update owner's profile with householdId
    if (profileId) {
      // If profileId provided, update directly
      await updateDoc(doc(db, "profiles", profileId), { householdId: docRef.id });
    } else {
      // Otherwise find and update the profile by uid
      const { updateProfile } = await import("@/lib/profiles");
      const profilesCol = collection(db, "profiles");
      const q = query(profilesCol, where("uid", "==", ownerUid));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        await updateProfile(snap.docs[0].id, { householdId: docRef.id });
      }
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating household:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate an invite code for a household
 */
export async function generateInviteCode(householdId, createdBy) {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6-char code
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
 * Accept an invite code and join a household
 */
export async function acceptInviteCode(code, uid) {
  try {
    const householdsSnap = await getDocs(collection(db, "households"));
    
    for (const householdDoc of householdsSnap.docs) {
      const household = householdDoc.data();

      // Check if this household's permanent invite code matches
      if (household.inviteCode === code) {
        // Check if user is already in this household
        if (household.members.some(m => m.uid === uid)) {
          return { success: false, error: "You are already a member of this household" };
        }

        // Add user to household members
        const householdRef = doc(db, "households", householdDoc.id);
        const updateMembers = [...(household.members || []), { uid }];
        await updateDoc(householdRef, { members: updateMembers });

        // Add user to family_profiles
        const familyResult = await addUserToFamilyProfile(uid, householdDoc.id);
        if (!familyResult.success) {
          throw new Error("Failed to add user to family profiles: " + familyResult.error);
        }

        return { success: true, householdId: householdDoc.id };
      }

      // Also check old-style one-time invites (for backwards compatibility)
      const invitesCol = collection(db, `households/${householdDoc.id}/invites`);
      const invitesSnap = await getDocs(invitesCol);

      for (const inviteDoc of invitesSnap.docs) {
        const invite = inviteDoc.data();
        
        if (
          invite.code === code &&
          !invite.used &&
          (!invite.expiresAt || new Date(invite.expiresAt.toDate()) > new Date())
        ) {
          // Check if user is already in this household
          if (household.members.some(m => m.uid === uid)) {
            return { success: false, error: "You are already a member of this household" };
          }

          const householdRef = doc(db, "households", householdDoc.id);
          const updateMembers = [...(household.members || []), { uid }];
          
          await updateDoc(householdRef, { members: updateMembers });
          await updateDoc(inviteDoc.ref, {
            used: true,
            usedBy: uid,
            usedAt: serverTimestamp(),
          });

          const familyResult = await addUserToFamilyProfile(uid, householdDoc.id);
          if (!familyResult.success) {
            throw new Error("Failed to add user to family profiles: " + familyResult.error);
          }

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
 * Get household details by ID
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
 * Get household for a user from family_profiles
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
 * Get all members of a household (with profile details)
 */
export async function getHouseholdMembers(householdId) {
  try {
    const household = await getHousehold(householdId);
    if (!household) return [];

    // Get profiles for each member
    const memberUids = household.members.map(m => m.uid);
    const members = [];

    for (const uid of memberUids) {
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
 * Get all invite codes for a household
 */
export async function getHouseholdInvites(householdId) {
  try {
    const invitesCol = collection(db, `households/${householdId}/invites`);
    const snap = await getDocs(invitesCol);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting household invites:", error);
    return [];
  }
}
