import { useState, useContext, useEffect } from "react";

import Game from "./Game";
import UserContext from "../contexts/user/userContext";
import { logUserIn } from "../auth/auth";
import PrivateRoomWaiting from "../components/game/waiting/PrivateWaitingRoom";

function PrivateGame({ socket }) {
  const [users, setUsers] = useState([]);
  const [gameExists, setGameExists] = useState(false);
  const [gameStarting, setGameStarting] = useState(false);

  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    logUserIn(setUser);
  }, []);

  useEffect(() => {
    console.log(gameStarting);
  }, [gameStarting]);

  useEffect(() => {
    socket.on("game_starting", () => {
      setGameStarting(true);
    });

    socket.on("room_joined", (data) => {
      setGameExists(true);
      const userData = data.user;
      userData.username = user.username;
      setUser((user) => ({ ...user, ...userData }));
    });

    socket.on("user_data", (data) => {
      const allUsers = data.allUsers;
      setUsers(() => allUsers);
      if (data.allUsers.length > 1) {
        socket.emit("start_game");
      }
    });

    socket.on("room_join_error", (err) => {
      console.log(err.message);
    });
  }, []);
  return (
    <>
      {gameExists && gameStarting ? (
        <Game roomCode={user.code} socket={socket} users={users} />
      ) : (
        <PrivateRoomWaiting socket={socket} roomCode={user.code} />
      )}
    </>
  );
}

export default PrivateGame;
