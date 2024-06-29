// src/App.jsx
import { useEffect } from "react";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth, updateUserStatus } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./lib/firebase";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo, setUserStatus } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const handleUserStatus = (user) => {
      if (user) {
        updateUserStatus(user.uid, true);

        window.addEventListener("beforeunload", () => {
          updateUserStatus(user.uid, false);
        });

        return () => {
          window.removeEventListener("beforeunload", () => {
            updateUserStatus(user.uid, false);
          });
        };
      }
    };

    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
      handleUserStatus(user);

      if (user) {
        const userStatusRef = doc(db, "status", user.uid);
        const unsubscribeStatus = onSnapshot(userStatusRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            setUserStatus(docSnapshot.data());
          }
        });

        return () => {
          unsubscribeStatus();
        };
      }
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo, setUserStatus]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      {currentUser ? (
        <>
          <List />
          {chatId && <Chat />}
          {chatId && <Detail />}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;
