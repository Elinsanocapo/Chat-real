// src/lib/userStore.js
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { create } from "zustand";
import { db } from "./firebase";

export const useUserStore = create((set) => ({
  currentUser: null,
  users: [], // Almacenar la lista de usuarios
  isLoading: true,
  userStatus: {}, // Agregado para almacenar el estado de conexión
  fetchUserInfo: async (uid) => {
    if (!uid) return set({ currentUser: null, isLoading: false });

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({ currentUser: docSnap.data(), isLoading: false });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      console.log(err);
      return set({ currentUser: null, isLoading: false });
    }
  },
  setUserStatus: (status) => set({ userStatus: status }), // Agregar función para actualizar el estado del usuario
  updateUserStatus: (userId, status) => set((state) => {
    const updatedUsers = state.users.map((user) =>
      user.id === userId ? { ...user, status } : user
    );
    return { users: updatedUsers };
  }),
}));
