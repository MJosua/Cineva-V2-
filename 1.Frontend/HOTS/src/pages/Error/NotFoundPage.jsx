import React, { useEffect, useState } from "react";
import { Image, Text, Spinner, useToast } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import Axios from "axios";
import { API_URL } from "../../config";
import { useDispatch } from "react-redux";
import { loginAction } from "../../action/userAction";

const NotFoundPage = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const refreshUserToken = async () => {
      const latestToken = localStorage.getItem("hots_tokek");

      if (latestToken) {
        try {
          const res = await Axios.get(`${API_URL}/auth/keep_login`, {
            headers: { Authorization: `Bearer ${latestToken}` },
          });

          if (res.data.length > 0) {
            const [userData, newToken] = res.data;

            if (newToken && newToken !== latestToken) {
              localStorage.setItem("hots_tokek", newToken);
            }

            dispatch(loginAction(userData));
            // Optionally, redirect to a valid page after successful refresh
            // navigate("/e-order/dashboard");
          } else {
            console.warn("Invalid session, forcing re-authentication...");
            toast({
              title: "Session Expired",
              description: "Please log in again.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            // navigate("/e-order/");
          }
        } catch (err) {
          console.error("Token refresh failed:", err);
          toast({
            title: "Token Refresh Failed",
            description: "Please log in again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          // navigate("/e-order/");
        }
      }
    };

    refreshUserToken();
  }, [dispatch, navigate, toast]);

  const meta = {
    title: `${location.pathname} page Indofood`,
    description: `Page of ${location.pathname} from Indofood`,
    canonical: `https://www.indofoodinternational.com/e-order${location.pathname}`,
    meta: {
      charset: "utf-8",
      name: {
        keywords: "react,meta,document,html,tags",
      },
    },
  };

  return (
    <div className="container ">
      {loading ? (
        <div className=" pt-5 pb-5 m-5 p-5 d-flex justify-content-center align-items-center row pt-5">
          <Spinner
            className="d-flex justify-content-center "
            thickness="10px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
            spacing={4}
          />
          <Text
            className="pb-2 fw-bold d-flex justify-content-center pt-5"
            textAlign="center"
            fontSize="6x2"
          >
            ~ LOADING..... ~
          </Text>
        </div>
      ) : (
        <div className="card pt-5 pb-5 m-5 p-5 d-flex justify-content-center">
          <Text className="pb-2 fw-bold" textAlign="center" fontSize="6x2">
            ~ OOPSIE! ~
          </Text>
          <Text textAlign="center" fontSize="6x1">
            Halaman yang Anda akses tidak tersedia
          </Text>
          <Text textAlign="center" fontSize="6x1">
            The Page that you are looking for are not exist
          </Text>
          <div className="d-flex justify-content-center mb-3">
            <Image
              className="d-flex justify-content-center p-1 ps-3 mb-2 mt-2 pt-2"
              boxSize=""
              alt={"NOTHING"}
              width="95%"
              maxWidth="250px"
              maxHeight="260px"
              src={require("../../assets/images/emptybox.PNG")}
            />
          </div>
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-danger fw-bold w-50 py-2 my-2"
              onClick={() => navigate(-1)}
            >
              BACK
            </button>
          </div>
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-outline-danger fw-bold w-50 py-2 my-2"
              onClick={() => navigate("/")}
            >
              HOME
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotFoundPage;
