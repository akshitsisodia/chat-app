import { useMutation } from "@tanstack/react-query";
import { uploadFiles } from "../Services/uploadApi";
import { setPublicKey } from "../Services/userAPI";

export const useUploadMutation = ({ setFiles, setAudioUrl }) => {
  return useMutation({
    mutationFn: uploadFiles,
    onSuccess: (data) => {
      setFiles(null);
      setAudioUrl("");
    },
    onError: (error) => {
      setFiles(null);
      setAudioUrl("");
      console.log(error?.response);
    },
  });
};
export const useAudioMutation = () => {
  return useMutation({
    mutationFn: uploadFiles,
    onSuccess: () => {},
    onError: (error) => {
      console.log(error?.response);
    },
  });
};

export const usePublicKeyMutation = () => {
  return useMutation({
    mutationFn: setPublicKey,
    onSuccess: (data) => {},
    onError: (error) => {
      console.log(error?.response);
    },
  });
};
