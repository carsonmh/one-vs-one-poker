import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config/firebase-config";
import axios from "axios";
import { signOut } from "firebase/auth";

function handleGoogleSignIn(setUser, setLoggedInWithGoogle) {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      axios
        .get("https://lunar-marker-335505.uw.r.appspot.com/api/get-users")
        .then((result) => {
          setLoggedInWithGoogle(true);
          const resData = result.data[user.uid];
          if (!resData || !resData.username) {
            return false;
          }
          setUser((user) => ({
            ...user,
            loggedIn: true,
          }));
          return true;
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorMessage);
      // const email = error.customData.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      return null;
    });
}

function handleGoogleLogout(setUser) {
  localStorage.clear();
  signOut(auth)
    .then(() => {
      console.log("signed out");
      setUser((user) => ({ ...user, loggedIn: false }));
      localStorage.clear();
      return false;
    })
    .catch((error) => {
      console.log(error);
    });
}

function logUserIn(setUser) {
  let userToken;
  auth.onAuthStateChanged((userCred) => {
    if (userCred) {
      const uid = userCred.uid;
      userCred
        .getIdToken()
        .then((token) => {
          userToken = token;
        })
        .catch((error) => console.log(error));
      axios
        .get("https://lunar-marker-335505.uw.r.appspot.com/api/get-users")
        .then((result) => {
          const resData = result.data[uid];
          if (!resData) {
            return false;
          }
          setUser((user) => ({
            ...user,
            ...resData,
            loggedIn: true,
            uid: uid,
          }));
          localStorage.setItem("user-token", "Bearer " + userToken);
          return true;
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      handleGoogleLogout(setUser);
    }
  });
}

async function checkUserToken() {
  const userToken = localStorage.getItem("user-token");
  if (!userToken || userToken === "undefined") {
    return false;
  }
  return axios
    .get("https://lunar-marker-335505.uw.r.appspot.com/api/check-auth", {
      headers: { authorization: userToken },
    })
    .then((result) => {
      if (!result || result.data.message !== "Success") {
        return false;
      } else {
        return true;
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

export { handleGoogleSignIn, logUserIn, checkUserToken, handleGoogleLogout };
