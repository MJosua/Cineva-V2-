import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from './useAppDispatch';
import { setUserData } from '../store/slices/authSlice';
import axios from 'axios';
import { API_URL } from '../config/sourceConfig';

interface UseAuthCheckProps {
  userToken2?: string;
  setIsTokenExpiredModalOpen: (open: boolean) => void;
}

export const useAuthCheck = ({ userToken2, setIsTokenExpiredModalOpen }: UseAuthCheckProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userToken = localStorage.getItem('hots_tokek');

  useEffect(() => {
    const keepLogin = async () => {

      if (!userToken) {
        console.warn('⚠ No token found, skipping keepLogin()');
        console.groupEnd();
        return;
      }

      try {


        const res = await axios.get(`${API_URL}/hots_auth/keepLogin`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });


        if (!res.data) {
          console.error('❌ ERROR: Response is empty or undefined');
          throw new Error("Empty response");
        }

        // Log specific values

        // Save new token
        localStorage.setItem("hots_tokek", res.data.hots_tokek);
        localStorage.setItem("current_delv_week", res.data.current_delv_week);

        const userData = res.data.userData;

        // Validate userData
        if (!userData || !userData.uid) {
          console.error("❌ Invalid userData received:", userData);
        } else {
          dispatch(setUserData({
            token: res.data.hots_tokek,
            userData,
          }));
        }

      } catch (err: any) {
        console.error('❌ keepLogin() ERROR:', err);

        if (err.response) {
          console.error("↪ Server responded with error:", err.response.status, err.response.data);
        } else if (err.request) {
          console.error("↪ No response from server:", err.request);
        } else {
          console.error("↪ Unexpected error:", err.message);
        }

        console.warn("🚨 Token expired or invalid — opening modal");
        setIsTokenExpiredModalOpen(true);
      }

      console.groupEnd();
    };

    keepLogin();
  }, [dispatch, userToken, userToken2, setIsTokenExpiredModalOpen]);
};
