import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header";
import {
    loginMiddleware
} from "../../action/userAction"
import {
    useDispatch
} from "react-redux"

//Styling
import {
    Text,
    Image,
    useToast

} from "@chakra-ui/react";


import {
    AiOutlineEye,
    AiOutlineEyeInvisible
} from 'react-icons/ai'
// import LogoBar from "../components/LogoBar";


const LoginPage = () => {

    const toast = useToast();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [user_id, setUser_id] = React.useState(0);
    const [company_id, setCompany_id] = React.useState(0);
    const [employee_id, setEmployee_id] = React.useState(0);
    const [type_id, setType_id] = React.useState(0);

    const [firstname, setFirstname] = React.useState('');
    const [lastname, setLastname] = React.useState('');

    const [uid, setUid] = React.useState('');
    const [pswd, setPswd] = React.useState('');




    /*
        {
            "userID": 10089,
            "company_id": 10089,
            "employee_id": 10089,
            "firstname": "admiin",
            "lastname": "marketiing",
            "uid": "admiin.marketiing",
            "pswd": "Indofood01", 
            "type_id":8
        }
    */

    // real login.
    const onLogin = async (userID, pswd) => {
        if (userID === "" || pswd === "") {
            toast({
                title: "Error!",
                description: `UserID or Password is empty!`,
                status: "error",
                duration: 6000, //in second
                isClosable: true
            })

        } else if (userID !== "" && pswd !== "") {

            let res = await dispatch(loginMiddleware(userID, pswd));

            if (!res.success) {
                toast({
                    title: "Oopsie!",
                    description: `UserID or password is incorrect! `,
                    status: "error",
                    duration: 6000, //in second
                    isClosable: true
                })
                // console.log("isi payload jika gagal", res.data)
            } else if (res.success) {
                toast({
                    title: `Hello  ${userID} !`,
                    description: `Log-in success `,
                    status: "success",
                    duration: 6000, //in second
                    isClosable: true,
                    className: "pb-5"
                })
                // console.log("isi payload jika sukses", res.data)
                navigate('/e-order/dashboard', { replace: true });
            }
        }
    }

    return (
        <div >
            <Header />
            {/* <div className="d-block d-sm-none"> */}

            {/* <NavbarPreLogin /> */}
            <div className="backgroundloginpageMobile">

                <div className="row p-0 m-0 h-100 pt-2 ">

                    <div
                        className="col-12 col-md-6 col-lg-6 p-5 text-start mt-2"
                    >
                        <Text
                            fontSize='3vw'
                            className="d-flex justify-content-start text-muted fw-bold  "
                        >
                            Create Account
                        </Text>

                        <div className="border border-lg rounded-3 border-secondary p-2">
                            <Text
                                fontSize='1vw'
                                className="d-flex justify-content-start text-muted fw-bold  "
                            >
                                1st ID:
                            </Text>

                            <div className="row">
                                <div className="col-3">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold  "
                                    >
                                        company_id (number)
                                    </Text>
                                </div>
                                <div className="col-9">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold  "
                                    >
                                        : company_id sesuai dengan request
                                    </Text>
                                </div>
                            </div>
                            <div className="row ">
                                <div className="col-3">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold "
                                    >
                                        user_id (number)
                                    </Text>
                                </div>
                                <div className="col-9">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold "
                                    >
                                        : user_id adalah company_id + 001 atau 01. Jika dalam company tersebut sudah ada, maka ditambahkan.
                                    </Text>
                                </div>
                            </div>
                            <div className="row ">
                                <div className="col-3">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold "
                                    >
                                        employee_id (number)
                                    </Text>
                                </div>
                                <div className="col-9">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold "
                                    >
                                        : kurang lebih sama dengan user_id. Ini untuk custom sih.
                                    </Text>
                                </div>
                            </div>
                            <div className="row ">
                                <div className="col-3">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold "
                                    >
                                        type_id (number)
                                    </Text>
                                </div>
                                <div className="col-9">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold "
                                    >
                                        : 1. ADMIN i2i dan e-order, 2. i2i user, 3. Distributor (utama), 4. Distributor (employee), 8. Admin News and Event, 9. SUPER ADMIN
                                    </Text>
                                </div>
                            </div>
                        </div>

                        <div className="border border-lg rounded-3 border-secondary p-2 mt-2">
                            <Text
                                fontSize='1vw'
                                className="d-flex justify-content-start text-muted fw-bold  "
                            >
                                2nd Name:
                            </Text>
                            <div className="row">
                                <div className="col-3">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold  "
                                    >
                                        firstname (string)
                                    </Text>
                                </div>
                                <div className="col-9">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold  "
                                    >
                                        : Nama depan dari user. jika distributor ya nama distributor
                                    </Text>
                                </div>
                            </div>
                            <div className="row ">
                                <div className="col-3">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold "
                                    >
                                        lastname (string)
                                    </Text>
                                </div>
                                <div className="col-9">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold "
                                    >
                                        : nama belakang
                                    </Text>
                                </div>
                            </div>
                        </div>

                        <div className="border border-lg rounded-3 border-secondary p-2 mt-2">
                            <Text
                                fontSize='1vw'
                                className="d-flex justify-content-start text-muted fw-bold  "
                            >
                                3nd access:
                            </Text>
                            <div className="row">
                                <div className="col-3">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold  "
                                    >
                                        userID (string)
                                    </Text>
                                </div>
                                <div className="col-9">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold  "
                                    >
                                        : firstname + '.' + lastname (firstname.lastname)
                                    </Text>
                                </div>
                            </div>
                            <div className="row ">
                                <div className="col-3">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold "
                                    >
                                        password (string)
                                    </Text>
                                </div>
                                <div className="col-9">
                                    <Text
                                        fontSize='1vw'
                                        className="d-flex justify-content-start text-muted fw-bold "
                                    >
                                        : default = Indofood01, jika distributor kasih random saja. 
                                    </Text>
                                </div>
                            </div>
                        </div>



                    </div>

                    <div id="" className="col-12 col-md-6 col-lg-6 p-4 pt-5 " >



                        <div className=" pt-3 pe-md-5 pe-lg-5 ">

                            <div className=" form-login opacity-0 mt-3 w-100 p-sm-3 pe-md-5 pe-lg-5  ">

                                <div className="form-login-posisi">
                                    <Text
                                        fontSize='2vw'
                                        className="d-flex justify-content-start text-muted fw-bold mt-3"
                                    >
                                        FORM
                                    </Text>

                                    <div className="row border border-secondary border-lg mb-1 rounded-3 ">

                                        <div className="col-3">
                                            <div className="mt-3 mb-3 input-group 
                                                    border 
                                                    border-secondary 
                                                    border-radius 
                                                    d-flex ">

                                                <input type='text '
                                                    className="border border-secondary border-radius  form-control background-putih pt-2 pb-3"
                                                    id="username"
                                                    placeholder="company_id"
                                                    onChange={(e) => setCompany_id(e.target.value)}

                                                />
                                            </div>

                                        </div>

                                        <div className="col-3">

                                            <div className="mt-3 mb-3 input-group 
                                                    border 
                                                    border-secondary 
                                                    border-radius 
                                                    d-flex "
                                            >

                                                <input type='text '
                                                    className="border border-secondary border-radius  form-control background-putih pt-2 pb-3"
                                                    id="username"
                                                    placeholder="user_id"
                                                    onChange={(e) => setUser_id(e.target.value)}

                                                />
                                            </div>

                                        </div>

                                        <div className="col-3">
                                            <div className="mt-3 mb-3 input-group 
                                                    border 
                                                    border-secondary 
                                                    border-radius 
                                                    d-flex ">

                                                <input type='text '
                                                    className="border border-secondary border-radius  form-control background-putih pt-2 pb-3"
                                                    id="username"
                                                    placeholder="employee_id"
                                                    onChange={(e) => setEmployee_id(e.target.value)}

                                                />
                                            </div>
                                        </div>

                                        <div className="col-3">
                                            <div className="mt-3 mb-3 input-group 
                                                    border 
                                                    border-secondary 
                                                    border-radius 
                                                    d-flex ">

                                                <input type='text '
                                                    className="border border-secondary border-radius  form-control background-putih pt-2 pb-3"
                                                    id="username"
                                                    placeholder="type_id"
                                                    onChange={(e) => setType_id(e.target.value)}

                                                />
                                            </div>
                                        </div>

                                    </div>

                                    <div className="row border border-secondary border-lg mb-1 rounded-3 ">
                                        <div className="col-6">
                                            <div className="mt-3 mb-3 input-group 
                                                    border 
                                                    border-secondary 
                                                    border-radius 
                                                    d-flex "
                                            >

                                                <input type='text '
                                                    className="border border-secondary border-radius  form-control background-putih pt-2 pb-3"
                                                    id="username"
                                                    placeholder="firstname"
                                                    onChange={(e) => setFirstname(e.target.value)}

                                                />
                                            </div>

                                        </div>

                                        <div className="col-6">
                                            <div className="mt-3 mb-3 input-group 
                                                    border 
                                                    border-secondary 
                                                    border-radius 
                                                    d-flex ">

                                                <input type='text '
                                                    className="border border-secondary border-radius  form-control background-putih pt-2 pb-3"
                                                    id="username"
                                                    placeholder="lastname"
                                                    onChange={(e) => setLastname(e.target.value)}

                                                />
                                            </div>

                                        </div>
                                    </div>

                                    <div className="row border border-secondary border-lg mb-1 rounded-3 ">
                                        <div className="col-6">
                                            <div className="mt-3 mb-3 input-group 
                                                    border 
                                                    border-secondary 
                                                    border-radius 
                                                    d-flex "
                                            >

                                                <input type='text '
                                                    className="border border-secondary border-radius  form-control background-putih pt-2 pb-3"
                                                    id="username"
                                                    placeholder="uid"
                                                    onChange={(e) => setUid(e.target.value)}

                                                />
                                            </div>

                                        </div>

                                        <div className="col-6">
                                            <div className="mt-3 mb-3 input-group 
                                                    border 
                                                    border-secondary 
                                                    border-radius 
                                                    d-flex ">

                                                <input type='text '
                                                    className="border border-secondary border-radius  form-control background-putih pt-2 pb-3"
                                                    id="username"
                                                    placeholder="pswd"
                                                    onChange={(e) => setPswd(e.target.value)}

                                                />
                                            </div>

                                        </div>
                                    </div>

                                    <button
                                        className="btn 
                                     btn-danger
                                     btn-radius
                                     
                                     shadow w-100 mt-3"
                                        type="button"
                                    // onClick={() => onLogin(uid, pswd)}
                                    >
                                        <Text className="menutext_heavy button-login"
                                            fontSize={'17px'}
                                        >
                                            Create Account
                                        </Text>

                                    </button>



                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* </div> */}
        </div>
    )
}

export default LoginPage; 