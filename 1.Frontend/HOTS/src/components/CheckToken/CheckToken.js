import Axios from "axios";
import { API_URL } from "../../config";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import {
    loginAction,
    loginMiddleware,
    logoutAction,
    seasonOut
} from "../../action/userAction";
import {
    Modal,
    Button,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
    useToast,
    Input,
    Image
} from "@chakra-ui/react";
import { DataProvider } from "./FetchData/DataContext";
import SessionModal from "./SessionModal";
import SearchBarComponent from "../SearchBarComponent";

const CheckToken = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();

    // Get token from local storage
    const [userToken, setUserToken] = useState(localStorage.getItem("hots_tokek") || "");

    useEffect(() => {
        localStorage.setItem("hots_tokek", userToken);
    }, [userToken]);

    const [pswd, setPswd] = useState("");

    const { uid } = useSelector((state) => ({
        uid: state.userReducer.uid
    }));

    const {
        isOpen: isOpenModalToken,
        onOpen: onOpenModalToken,
        onClose: onCloseModalToken
    } = useDisclosure();

    const [updateSession, setUpdateSession] = useState(false)

    useEffect(() => {
        let isMounted = true; // Prevent state updates on unmounted components

        const fetchToken = async () => {
            const latestToken = localStorage.getItem("hots_tokek"); // Ensure latest token

            if (!latestToken) {
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
                    localStorage.setItem("hots_tokek", newToken);
                    if (isMounted) setUserToken(newToken);
                    // console.log("perubahantoken")
                }

                if (isMounted) dispatch(loginAction(userData));

            } catch (err) {
                if (err.response?.status === 401) {
                    console.warn("Token expired, prompting login...");
                    onOpenModalToken();
                } else {
                    console.error("Unexpected error:", err);
                    handleLogout();
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
        localStorage.removeItem("hots_tokek");
        dispatch(logoutAction());
        dispatch(seasonOut());
        navigate("/e-order/");
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
