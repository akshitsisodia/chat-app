import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  loginUser,
  logoutUser,
  registerUser,
  setOtp,
  verifyUser,
} from "../Services/authAPI";
import { useAuth } from "../Context/AuthContext";
import { decryptPrivateKey } from "./usePrivateKeyEncryption";
import { disconnectSocket } from "../Lib/socket";

export const getLoginMutation = ({ password, setPassword, setEmail }) => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      const user = data.data.data;
      const privateKey = await decryptPrivateKey(
        user?.encrypted_private_key,
        password,
        user.salt,
        user.iv,
      );
      localStorage.setItem("privateKey", privateKey);
      setPassword("");
      setEmail("");
      login();
    },
    onError: (error) => {
      setPassword("");
    },
  });
};

export const getOtpMutation = ({ setNext, setName, setEmail }) => {
  return useMutation({
    mutationFn: setOtp,
    onSuccess: (data) => {
      localStorage.setItem("verificationEmail", data?.data);
      setNext(true);
      setName("");
      setEmail("");
    },
  });
};

export const getVerifyMutation = ({ setContinue, setMessage }) => {
  return useMutation({
    mutationFn: verifyUser,
    onSuccess: (data) => {
      setContinue(true);
      setMessage("");
    },
  });
};

export const getRegisterMutation = ({ setPassword, setConPassword }) => {
  const { login } = useAuth();
  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      setPassword("");
      setConPassword("");
      login();
    },
  });
};

export const getLogoutMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      disconnectSocket();
      queryClient.clear();
      localStorage.clear();
      navigate("/auth", { replace: true });
    },
  });
};
