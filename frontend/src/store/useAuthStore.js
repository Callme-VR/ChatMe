import {
  create
} from "zustand";
import {
  axiosInstance
} from "../lib/axios.js";
import toast from "react-hot-toast";
import {
  io
} from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:6001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({
        authUser: res.data
      });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({
        authUser: null
      });
    } finally {
      set({
        isCheckingAuth: false
      });
    }
  },

  signup: async (data) => {
    set({
      isSigningUp: true
    });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({
        authUser: res.data
      });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      const message =
        error &&
        error.response &&
        error.response.data &&
        error.response.data.message ?
        error.response.data.message :
        "Signup failed";
      toast.error(message);
    } finally {
      set({
        isSigningUp: false
      });
    }
  },

  login: async (data) => {
    set({
      isLoggingIn: true
    });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({
        authUser: res.data
      });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      const message =
        error &&
        error.response &&
        error.response.data &&
        error.response.data.message ?
        error.response.data.message :
        "Login failed";
      toast.error(message);
    } finally {
      set({
        isLoggingIn: false
      });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({
        authUser: null
      });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      const message =
        error &&
        error.response &&
        error.response.data &&
        error.response.data.message ?
        error.response.data.message :
        "Logout failed";
      toast.error(message);
    }
  },

  updateProfile: async (data) => {
    set({
      isUpdatingProfile: true
    });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({
        authUser: res.data
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);
      const message =
        error &&
        error.response &&
        error.response.data &&
        error.response.data.message ?
        error.response.data.message :
        "Update failed";
      toast.error(message);
    } finally {
      set({
        isUpdatingProfile: false
      });
    }
  },

  connectSocket: () => {
    const store = get();
    const authUser = store.authUser;
    const socket = store.socket;

    if (!authUser || (socket && socket.connected)) return;

    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });

    newSocket.connect();

    set({
      socket: newSocket
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({
        onlineUsers: userIds
      });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.disconnect();
    }
  },
}));