// src/components/list/chatList/ChatList.jsx
import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    const fetchChatData = async () => {
      const unSub = onSnapshot(
        doc(db, "userchats", currentUser.id),
        async (res) => {
          const items = res.data().chats;

          const promises = items.map(async (item) => {
            const userDocRef = doc(db, "users", item.receiverId);
            const userStatusRef = doc(db, "status", item.receiverId);
            
            const [userDocSnap, userStatusSnap] = await Promise.all([
              getDoc(userDocRef),
              getDoc(userStatusRef)
            ]);

            const user = userDocSnap.data();
            const userStatus = userStatusSnap.data();

            return { ...item, user: { ...user, ...userStatus } };
          });

          const chatData = await Promise.all(promises);

          setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      );
      return () => {
        unSub();
      };
    };

    fetchChatData();
  }, [currentUser.id]);

  useEffect(() => {
    const unsubscribeArray = [];

    chats.forEach((chat) => {
      const userStatusRef = doc(db, "status", chat.receiverId);
      const unsubscribeStatus = onSnapshot(userStatusRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          setChats((prevChats) =>
            prevChats.map((prevChat) =>
              prevChat.receiverId === chat.receiverId
                ? { ...prevChat, user: { ...prevChat.user, ...docSnapshot.data() } }
                : prevChat
            )
          );
        }
      });
      unsubscribeArray.push(unsubscribeStatus);
    });

    return () => {
      unsubscribeArray.forEach((unsubscribe) => unsubscribe());
    };
  }, [chats]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
          }}
        >
          <img
            src={
              chat.user.blocked.includes(currentUser.id)
                ? "./avatar.png"
                : chat.user.avatar || "./avatar.png"
            }
            alt=""
          />
          <div className="texts">
            <div className="user-info">
              <span className="username">
                {chat.user.blocked.includes(currentUser.id)
                  ? "User"
                  : chat.user.username}
              </span>
              <div
                className={`status-dot ${chat.user.isOnline ? "online" : "offline"}`}
                title={chat.user.isOnline ? "Online" : "Offline"}
              />
            </div>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;
