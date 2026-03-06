import {
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
    useToast,
    Input,
    Image
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Axios from "axios";
import { API_URL } from "../../../../config";
import { loginUser, logoutAction, seasonOut, loginMiddleware } from "../../../../action/userAction";
import { DataProvider } from "./FetchData/DataContext";
import SessionModal from "./SessionModal";
import SearchBarComponent from "../../../../components/inputs/SearchBarComponent";

const CheckToken = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();

    // Get token from local storage
    const [userToken, setUserToken] = useState(localStorage.getItem("tokek") || "");

    useEffect(() => {
        localStorage.setItem("tokek", userToken);
    }, [userToken]);

    const [pswd, setPswd] = useState("");


    const uid = useSelector((state) => state.userReducer.uid);


    const {
        isOpen: isOpenModalToken,
        onOpen: onOpenModalToken,
        onClose: onCloseModalToken
    } = useDisclosure();

    const [updateSession, setUpdateSession] = useState(false)

    useEffect(() => {
        let isMounted = true; // Prevent state updates on unmounted components

        const fetchToken = async () => {
            const latestToken = localStorage.getItem("tokek"); // Ensure latest token

            if (!latestToken) {
                const publicPaths = ["/e-order/login", "/e-order", "/"];
                if (publicPaths.includes(window.location.pathname)) {
                    return;
                }
                console.log("No token found, prompting login...");
                onOpenModalToken();
                return;
            }

            try {
                const res = await Axios.get(`${API_URL}/auth/keep_login`, {
                    headers: { Authorization: `Bearer ${latestToken}` },
                });

                if (res.data.length === 0) {
                    console.warn("Invalid session, forcing re-authentication...");
                    onOpenModalToken();
                    return;
                }

                const [userData, newToken] = res.data;

                if (!userData?.uid) {
                    console.warn("Invalid user data, forcing logout...");
                    handleLogout();
                    return;
                }

                if (newToken && newToken !== latestToken) {
                    localStorage.setItem("tokek", newToken);
                    if (isMounted) setUserToken(newToken);
                    // console.log("perubahantoken")
                }

                if (isMounted) dispatch(loginUser(userData));

            } catch (err) {
                if (err.response?.status === 401) {
                    console.warn("Token expired, prompting login...");
                    onOpenModalToken();
                } else {
                    console.error("Unexpected error:", err);
                    // Instead of full logout, try to show modal first
                    // or if it's a network error, maybe just toast.
                    onOpenModalToken();
                }
            }
        };

        const timeout = setTimeout(fetchToken, 500); // Debounce calls

        return () => {
            isMounted = false; // Cleanup to prevent memory leaks
            clearTimeout(timeout);
        };

    }, [dispatch, navigate]); // No `userToken` dependency to prevent infinite loop

    const handleLogout = () => {
        // Clear local credentials
        localStorage.removeItem("tokek");
        dispatch(logoutAction());
        // sessionOut is a utility, not an action
        seasonOut();
        navigate("/e-order/login"); // Navigate to login instead of root
    };

    const onLogin = async (event) => {
        event.preventDefault();

        if (!uid) {
            toast({
                title: "Error!",
                description: "User session expired. Please log in again.",
                status: "error",
                duration: 6000,
                isClosable: true
            });
            return;
        }

        if (!pswd) {
            toast({
                title: "Error!",
                description: "Password cannot be empty!",
                status: "error",
                duration: 6000,
                isClosable: true
            });
            return;
        }

        let res = await dispatch(loginMiddleware(uid, pswd));

        if (res?.success) {
            onCloseModalToken();
            toast({
                title: "Login Successful!",
                description: res.message,
                status: "success",
                duration: 6000,
                isClosable: true
            });
            setPswd("");
            // setUserToken

            setTimeout(() => {
                setUpdateSession((prevValue) => !prevValue);
            }, 1000);

        } else {
            toast({
                title: "Login Failed!",
                description: res?.message || "Invalid credentials.",
                status: "error",
                duration: 6000,
                isClosable: true
            });
        }
    };

    useEffect(() => {
        const responseInterceptor = Axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    console.warn("Session expired. Showing login modal...");
                    onOpenModalToken(); // Show modal when token expires
                }
                return Promise.reject(error);
            }
        );

        return () => {
            Axios.interceptors.response.eject(responseInterceptor);
        };
    }, []);


    return (
        <DataProvider
            token={userToken}
            updateSession={updateSession}
            setUserToken={setUserToken}
        >
            <div className="container-fluid">
                {/* navbar */}
                <SearchBarComponent />
                {/* Modal for session expiration */}
                <SessionModal
                    isOpenModalToken={isOpenModalToken}
                    handleLogout={handleLogout}
                    uid={uid}
                    onLogin={onLogin}
                    pswd={pswd}
                    setPswd={setPswd}
                />

                <Outlet />

            </div>

        </DataProvider>
    );
};

export default CheckToken;





