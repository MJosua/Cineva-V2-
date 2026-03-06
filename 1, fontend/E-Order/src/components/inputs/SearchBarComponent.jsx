
import React from "react";


import { useDispatch, useSelector } from "react-redux";

import {
    IconButton,
    // Input,
    // InputGroup,
    // InputRightElement,
    useToast,
    FormLabel,
    Textarea,
    Modal,
    Button,
    ModalCloseButton,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalOverlay,
    ModalContent,
    useDisclosure,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    // MenuItemOption,
    // MenuGroup,
    // MenuOptionGroup,
    // MenuDivider,
    Image,
    Input,
    InputGroup,
    InputRightElement,
    Text,

} from "@chakra-ui/react"
import { FaGear } from "react-icons/fa6";



import {
    // SearchIcon,
    PlusSquareIcon,
    CheckCircleIcon,
    // InfoOutlineIcon,
    ArrowForwardIcon,
    HamburgerIcon,
    // AddIcon,
    ExternalLinkIcon,
    // RepeatIcon,
    EditIcon
    // AiOutlineHome
} from "@chakra-ui/icons";

import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";


import Axios from "axios";
import { API_URL } from "../../config";

import logoIndofood from '../../assets/ui/logo_indofoodCBP_white.png';
import emptyPlate from "../../assets/images/emptyplate.PNG";

import { seasonOut, logoutAction, loginAction } from "../../action/userAction";
// import {
//     FaPowerOff
// } from 'react-icons/fa'

import {
    useNavigate
} from "react-router-dom";

function truncateText(text, maxLength) {
    // Split the text into words
    const words = text.split(' ');

    // Initialize an empty string to store the truncated text
    let truncatedText = '';

    // Loop through each word
    for (const word of words) {
        // Check if adding the current word will exceed the maxLength
        if ((truncatedText + word).length > maxLength) {
            break; // Stop if adding the current word exceeds maxLength
        }

        // Add the word to the truncatedText
        truncatedText += word + ' ';
    }

    // Trim any trailing whitespace
    truncatedText = truncatedText.trim();

    return truncatedText;
}

const SearchBarComponent = ({

}) => {


    // toast hook
    const toast = useToast();

    const dispatch = useDispatch();

    const type_id = useSelector((state) => state.userReducer.type_id);
    const user_type = useSelector((state) => state.userReducer.user_type);

    const company_name = useSelector((state) => state.userReducer.company_name);
    const uid = useSelector((state) => state.userReducer.uid);
    const company_id = useSelector((state) => state.userReducer.company_id);




    const navigate = useNavigate();
    // const toast = useToast();

    let username = uid
    const truncatedData = truncateText(company_name, 36);


    const onLogOut = () => {
        dispatch(logoutAction());
        navigate('/');
    }

    const { isOpen, onOpen, onClose } = useDisclosure()

    const {
        isOpen: isOpenModalSettings,
        onOpen: onOpenModalSettings,
        onClose: onCloseModalSettings,
    } = useDisclosure();

    const {
        isOpen: isOpenModalEditProf,
        onOpen: onOpenModalEditProf,
        onClose: onCloseModalEditProf,
    } = useDisclosure();

    const {
        isOpen: isOpenModalChangePswd,
        onOpen: onOpenModalChangePswd,
        onClose: onCloseModalChangePswd,
    } = useDisclosure();



    const [prevPassword, setPrevPassword] = React.useState([]);
    const [newPassword1, setNewPassword1] = React.useState([]);
    const [newPassword2, setNewPassword2] = React.useState([]);


    const [visiblePrevPass, setVisiblePrevPass] = React.useState("password");
    const [visibleNewPass1, setVisibleNewPass1] = React.useState("password");
    const [visibleNewPass2, setVisibleNewPass2] = React.useState("password");

    const [address, setAddress] = React.useState(
        "Building, road, region, country"
    );


    const initialRefEditProf = React.useRef(null);
    const finalRefEditProf = React.useRef(null);
    const initialRefChangePswd = React.useRef(null);
    const finalRefChangePswd = React.useRef(null);

    const [email, setEmail] = React.useState("admin@mail.com");
    const [contact_person, setContact_person] = React.useState("Mr.F");
    const [contact_number, setContact_number] = React.useState("+62-25968296");
    const [website, setWebsite] = React.useState("example.com");
    const [tin, setTin] = React.useState("123456");
    const [remarks, setRemarks] = React.useState("Catatan Kosong");


    const handleConfirmEditProf = () => {
        let userToken = localStorage.getItem("tokek");
        Axios.post(
            API_URL + "/user/request-change-data",
            {
                address,
                email,
                contact_person,
                contact_number,
                website,
                tin,
                remarks
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            }
        )
            .then((res) => {
                // console.log("res", res);
                if (res.data.success) {
                    toast({
                        title: "Yeay!",
                        description: res.data.message,
                        status: "success",
                        duration: 6000,
                        isClosable: true,
                    });
                    onCloseModalEditProf();
                    onCloseModalSettings();
                } else {
                    toast({
                        title: "Oopsie!",
                        description: res.data.message,
                        status: "error",
                        duration: 6000,
                        isClosable: true,
                    });
                    onCloseModalEditProf();
                    onCloseModalSettings();
                }
            })
            .catch((err) => {
                // console.log("Axios error when change password", err);
            });
    };


    const changeVisiblePrevPass = () => {
        if (visiblePrevPass === "password") {
            setVisiblePrevPass("text");
        } else if (visiblePrevPass === "text") {
            setVisiblePrevPass("password");
        }
    };

    const changeVisibleNewPass1 = () => {
        if (visibleNewPass1 === "password") {
            setVisibleNewPass1("text");
        } else if (visibleNewPass1 === "text") {
            setVisibleNewPass1("password");
        }
    };

    const changeVisibleNewPass2 = () => {
        if (visibleNewPass2 === "password") {
            setVisibleNewPass2("text");
        } else if (visibleNewPass2 === "text") {
            setVisibleNewPass2("password");
        }
    };

    const onChangePassword = () => {
        let userToken = localStorage.getItem("tokek");
        const huruf = /[a-zA-Z]/;
        const angka = /[0-9]/;
        if (
            newPassword1 !== newPassword2 ||
            newPassword1.length < 8 ||
            newPassword1.includes(" ") ||
            !huruf.test(newPassword1) ||
            !angka.test(newPassword1)
        ) {
            toast({
                title: "Oopsie!",
                description: `Your New password doesnt meet the requirement!`,
                status: "error",
                duration: 6000,
                isClosable: true,
            });
        } else {
            let pswd = prevPassword;
            let newPswd = newPassword2;


            Axios.post(
                API_URL + "/auth/change_pass",
                { uid, pswd, newPswd },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                    },
                }
            )
                .then((res) => {
                    // console.log("res", res);
                    if (res.data.success) {
                        toast({
                            title: "Yeay!",
                            description: res.data.message,
                            status: "success",
                            duration: 6000,
                            isClosable: true,
                        });
                        navigate("/");
                        dispatch(logoutAction());
                        setTimeout(() => {
                            seasonOut();
                        }, 1500);

                    } else {
                        toast({
                            title: "Oopsie!",
                            description: res.data.message,
                            status: "error",
                            duration: 6000,
                            isClosable: true,
                        });
                    }
                })
                .catch((err) => {
                    // console.log("Axios error when change password", err);
                    //   seasonOut();
                });
        }
    };

    const validateInput = (value) => {
        // Simple validation example: allow only alphanumeric characters and some special characters
        const regex = /^[a-zA-Z0-9\s\/\\\-_()]*$/
        if (!regex.test(value)) {
            toast({
                title: "Error!",
                description: `Input Can't Use That Special Character`,
                status: "error",
                duration: 6000,
                isClosable: true
            });
            return false;
        } else {
            return true;

        }
    };

    return (
        // <div className="container">

        <div className="navbar navbar-expand-xl navbar-light bg-danger  fixed-top ps-1">

            <>
                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalBody>
                            <div className=" text-center  pt-4 fw-bold text-muted fs-5">
                                <span className="text-center pt-4 fw-bold text-muted fs-5">
                                    You Are About to Log Out.
                                </span>
                                <br></br>
                                <span>
                                    Are You Sure?
                                </span>
                            </div>

                        </ModalBody>
                        <ModalFooter>
                            <div className="px-3 py-2 d-flex justify-content-center w-100 ">
                                <button
                                    className="btn btn-white btn-outline-danger px-4 py-2 m-1 fw-bold"
                                    onClick={onClose} >
                                    Back
                                </button>
                                <button
                                    className="btn btn-danger px-3 py-2 m-1 fw-bold"
                                    onClick={onLogOut}>
                                    Log Out
                                </button>
                            </div>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>

            <div className="container-fluid d-flex " >
                {/* <div className="col-4 col-lg-5  "> */}
                <div className="col-12">
                    <div className="row">
                        {/* <div className="col-4 ">

                            <div onClick={() => navigate('/e-order/dashboard')}>
                                <IconButton
                                    aria-label=''
                                    icon={
                                        <svg className="Icon_awesome-home  pe-2" viewBox="-0.001 2.254 35 27.217">
                                            <path id="Icon_awesome-home"
                                                d="M 17.0349006652832 9.314338684082031 L 5.832733631134033 18.54061889648438 L 5.832733631134033 28.49843788146973 C 5.832733631134033 29.03533935546875 6.267978668212891 29.47058486938477 6.804880142211914 29.47058486938477 L 13.61355304718018 29.45296669006348 C 14.14855670928955 29.45029258728027 14.58084583282471 29.01582717895508 14.58083915710449 28.48081970214844 L 14.58083915710449 22.66555786132812 C 14.58083915710449 22.1286563873291 15.01608371734619 21.69341087341309 15.55298614501953 21.69341087341309 L 19.44157218933105 21.69341087341309 C 19.97847366333008 21.69341087341309 20.41371917724609 22.1286563873291 20.41371917724609 22.66555786132812 L 20.41371917724609 28.47656440734863 C 20.41291046142578 28.73491859436035 20.51497650146484 28.98296928405762 20.6973762512207 29.16594123840332 C 20.8797779083252 29.34891128540039 21.12750816345215 29.45174980163574 21.38586616516113 29.45174980163574 L 28.19210624694824 29.47058486938477 C 28.72900772094727 29.47058486938477 29.16425323486328 29.03533935546875 29.16425323486328 28.49843788146973 L 29.16425323486328 18.533935546875 L 17.96451568603516 9.314338684082031 C 17.69322395324707 9.095663070678711 17.30619430541992 9.095663070678711 17.0349006652832 9.314338684082031 Z M 34.72979354858398 15.58529281616211 L 29.65032577514648 11.39837837219238 L 29.65032577514648 2.982625722885132 C 29.65032577514648 2.579949378967285 29.32389450073242 2.253515720367432 28.92121696472168 2.253515720367432 L 25.51870346069336 2.253515720367432 C 25.11602783203125 2.253515720367432 24.78959274291992 2.579949617385864 24.78959274291992 2.982625961303711 L 24.78959274291992 7.39434814453125 L 19.34982490539551 2.91882848739624 C 18.27321815490723 2.032889366149902 16.72012519836426 2.032889366149902 15.64351844787598 2.91882848739624 L 0.2635484337806702 15.58529281616211 C -0.0469624325633049 15.84193801879883 -0.09049597382545471 16.30176544189453 0.1663340032100677 16.61212539672852 L 1.715692520141602 18.49565696716309 C 1.838688492774963 18.64521408081055 2.016125440597534 18.73970222473145 2.208869695663452 18.75828170776367 C 2.401613712310791 18.77685928344727 2.593831777572632 18.71800422668457 2.743130207061768 18.59469413757324 L 17.0349006652832 6.823212146759033 C 17.30619430541992 6.604537487030029 17.69322395324707 6.604537487030029 17.96451759338379 6.82321310043335 L 32.25689697265625 18.59469413757324 C 32.56725692749023 18.85152244567871 33.02708435058594 18.8079891204834 33.28372955322266 18.49748039245605 L 34.83308792114258 16.61394500732422 C 34.95629119873047 16.46404266357422 35.01466369628906 16.27121162414551 34.99527740478516 16.07814788818359 C 34.97589111328125 15.88508129119873 34.88034820556641 15.70770740509033 34.72980117797852 15.58529281616211 Z">
                                            </path>
                                        </svg>
                                    }
                                    size='md'
                                    className="bg-danger d-flex justify-content-start "

                                />
                            </div>
                        </div> */}
                        <div className="col-8  d-flex justify-content-start py-1">
                            {/* </div> */}
                            {/* <div className="col-4 col-lg-2  "> */}
                            <div className=" "
                                onClick={() => navigate('/e-order/')}
                            >



                                <Image
                                    className="d-flex  d-flex posisilogo pt-2 "
                                    src={logoIndofood}
                                    boxSize=''
                                    width='180px'

                                    minHeight='5px'
                                    fallbacksrc={emptyPlate}>
                                </Image>

                            </div>
                        </div>

                        {/* </div> */}
                        {/* <div className="col-4 col-lg-5   d-flex justify-content-end"> */}

                        <div className="col-4 ">
                            <div className='float-right mt-1 d-flex justify-content-end me-2'>
                                <div className="white_text_bold d-flex align-items-center fs-6  me-2 d-none d-md-block" id="usernamelogin" style={{ marginTop: "2-px" }}>
                                    <div className="row  ">
                                        <div className="col-12 text-end pe-4">
                                            {truncatedData}
                                        </div>

                                        <div className="col-12 text-end fw-normal pe-4" style={{ marginTop: "-7.5px" }}>
                                            {username}
                                        </div>

                                    </div>

                                </div>

                                <Menu>
                                    <MenuButton
                                        as={IconButton}
                                        aria-label='Options'
                                        id="tombolmenu"
                                        color='#FFF'
                                        _hover={{
                                            backgroundColor: "#FFF",
                                            color: "#EB262A"
                                        }}

                                        _active={{
                                            backgroundColor: "#FFF",
                                            color: "#EB262A"

                                        }}
                                        className="btn-gearicon-topright"
                                        icon={
                                            <>
                                                <HamburgerIcon className="d-md-none d-block icon-gearicon-topright"
                                                />
                                                <FaGear className="d-none d-md-block icon-gearicon-topright" />
                                            </>
                                        }
                                        variant='outline'

                                    />

                                    <MenuList>
                                        <MenuItem className="d-block d-md-none" icon={<CheckCircleIcon />} >
                                            {username}
                                        </MenuItem>
                                        {type_id === 3 || type_id === 4 ? (
                                            <>
                                                <MenuItem className="d-block d-md-none" onClick={() => navigate('/e-order/catalog')} icon={<PlusSquareIcon />}>
                                                    Catalog
                                                </MenuItem>
                                                <MenuItem className="d-block d-md-none" onClick={() => navigate('/e-order/profile')} icon={<EditIcon />}>
                                                    Account
                                                </MenuItem>
                                                <MenuItem className="d-block d-md-none" onClick={() => navigate('/e-order/help')} icon={<ExternalLinkIcon />}>
                                                    Help
                                                </MenuItem>

                                            </>
                                        ) : type_id === 9 ?
                                            <>
                                                <MenuItem className="d-block d-md-none" onClick={() => navigate('/e-order/admin')} icon={<PlusSquareIcon />}>
                                                    Acc Management
                                                </MenuItem>
                                                <MenuItem className="d-block d-md-none" onClick={() => navigate('/e-order/BannerSettings')} icon={<PlusSquareIcon />}>
                                                    Banner Settings
                                                </MenuItem>
                                                <MenuItem className="d-block d-md-none" onClick={() => navigate('/e-order/itemconfig')} icon={<PlusSquareIcon />}>
                                                    Special Treatment
                                                </MenuItem>

                                            </>
                                            :
                                            null
                                        }
                                        <MenuItem onClick={onOpenModalSettings} icon={<ArrowForwardIcon />}>
                                            Settings
                                        </MenuItem>
                                        <MenuItem onClick={onOpen} icon={<ArrowForwardIcon />}>
                                            Log-Out
                                        </MenuItem>

                                    </MenuList>
                                </Menu>
                            </div>
                            {/* </div> */}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                className="pb-5"
                onClose={onCloseModalSettings}
                isOpen={isOpenModalSettings}
            >
                <ModalOverlay />
                <ModalContent >
                    <ModalHeader className="text-center">
                        Settings
                    </ModalHeader>
                    <ModalBody>
                        <div className="d-grid gap-2">
                            <div
                                className="btn   btn-setting  shadow-sm mb-2"
                                onClick={onOpenModalEditProf}
                            >
                                Request Edit Profile Data
                            </div>
                            <div
                                className="btn   btn-setting  shadow-sm mb-2"
                                onClick={onOpenModalChangePswd}
                            >
                                Change Password
                            </div>
                            {/* <Button
                                                className="btn left_text"
                                                type="button"
                                                onClick={() => navigate("/e-order/help")}
                                            >
                                                Help
                                            </Button> */}

                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <>
                <Modal
                    initialFocusRef={initialRefEditProf}
                    finalFocusRef={finalRefEditProf}
                    isOpen={isOpenModalEditProf}
                    onClose={onCloseModalEditProf}
                >
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader display="flex" justifyContent="center">
                            Request Edit Profile Data
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            <div className="row">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        Name
                                    </FormLabel>
                                </div>
                                <div className="col-7">
                                    <div className="name_text py-2 ps-1">{uid}</div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        Address
                                    </FormLabel>
                                </div>
                                <div className="col-7">
                                    <Textarea
                                        ref={initialRefEditProf}
                                        placeholder={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        style={{ fontStyle: "italic" }}
                                    />
                                </div>
                            </div>
                            <div className="row pt-2">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        Email
                                    </FormLabel>
                                </div>
                                <div className="col-7">
                                    <Input
                                        ref={initialRefEditProf}
                                        placeholder={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ fontStyle: "italic" }}
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        Contact Person
                                    </FormLabel>
                                </div>
                                <div className="col-7">
                                    <Input
                                        ref={initialRefEditProf}
                                        placeholder={contact_person}
                                        onChange={(e) => setContact_person(e.target.value)}
                                        style={{ fontStyle: "italic" }}
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        Contact Number
                                    </FormLabel>
                                </div>
                                <div className="col-7">
                                    <Input
                                        ref={initialRefEditProf}
                                        placeholder={contact_number}
                                        onChange={(e) => setContact_number(e.target.value)}
                                        style={{ fontStyle: "italic" }}
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        Website
                                    </FormLabel>
                                </div>
                                <div className="col-7">
                                    <Input
                                        ref={initialRefEditProf}
                                        placeholder={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        style={{ fontStyle: "italic" }}
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        TIN
                                    </FormLabel>
                                </div>
                                <div className="col-7">
                                    <Input
                                        ref={initialRefEditProf}
                                        placeholder={tin}
                                        onChange={(e) => setTin(e.target.value)}
                                        style={{ fontStyle: "italic" }}
                                    />
                                </div>
                            </div>
                        </ModalBody>

                        <ModalFooter

                            display="flex"
                            justifyContent="center"
                        >
                            <Button colorscheme="red" onClick={handleConfirmEditProf}>
                                Confirm
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>

            {/* MODAL CHANGE PASSWORD */}
            <>
                <Modal
                    initialFocusRef={initialRefChangePswd}
                    finalFocusRef={finalRefChangePswd}
                    isOpen={isOpenModalChangePswd}
                    onClose={onCloseModalChangePswd}
                >
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader className="text-center">Change Password</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            <div className="row">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        User ID
                                    </FormLabel>
                                </div>
                                <div className="col-7 py-2">
                                    <FormLabel
                                        style={{ fontStyle: "italic" }}
                                    >
                                        {uid}
                                    </FormLabel>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        Old Password
                                    </FormLabel>
                                </div>
                                <div className="col-7">
                                    <InputGroup size="md">
                                        <Input
                                            ref={initialRefChangePswd}
                                            placeholder="previous password"
                                            onChange={(e) => setPrevPassword(e.target.value)}
                                            type={visiblePrevPass}
                                        />
                                        <InputRightElement width="4.5rem">
                                            <Button
                                                h="1.75rem"
                                                size="sm"
                                                onClick={changeVisiblePrevPass}
                                            >
                                                {visiblePrevPass === "password" ? (
                                                    <AiOutlineEyeInvisible size={26} />
                                                ) : (
                                                    <AiOutlineEye size={26} />
                                                )}
                                            </Button>
                                        </InputRightElement>
                                    </InputGroup>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        New Password
                                    </FormLabel>
                                </div>
                                <div className="col-7">
                                    <InputGroup size="md">
                                        <Input
                                            ref={initialRefChangePswd}
                                            placeholder="min 8 character"
                                            onChange={(e) => setNewPassword1(e.target.value)}
                                            type={visibleNewPass1}
                                        />
                                        <InputRightElement width="4.5rem">
                                            <Button
                                                h="1.75rem"
                                                size="sm"
                                                onClick={changeVisibleNewPass1}
                                            >
                                                {visibleNewPass1 === "password" ? (
                                                    <AiOutlineEyeInvisible size={26} />
                                                ) : (
                                                    <AiOutlineEye size={26} />
                                                )}
                                            </Button>
                                        </InputRightElement>
                                    </InputGroup>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-5 py-2">
                                    <FormLabel className="edit_profile_form_label">
                                        Confirm Password
                                    </FormLabel>
                                </div>
                                <div className="col-7">
                                    <InputGroup size="md">
                                        <Input
                                            ref={initialRefChangePswd}
                                            placeholder="min 8 character"
                                            onChange={(e) => setNewPassword2(e.target.value)}
                                            type={visibleNewPass2}
                                        />
                                        <InputRightElement width="4.5rem">
                                            <Button
                                                h="1.75rem"
                                                size="sm"
                                                onClick={changeVisibleNewPass2}
                                            >
                                                {visibleNewPass2 === "password" ? (
                                                    <AiOutlineEyeInvisible size={26} />
                                                ) : (
                                                    <AiOutlineEye size={26} />
                                                )}
                                            </Button>
                                        </InputRightElement>
                                    </InputGroup>
                                </div>
                            </div>
                        </ModalBody>
                        <Text
                            fontSize="md"
                            className="d-flex text-center justify-content-center"
                        >
                            Your password must contain number and letter
                            <br></br>

                            and more than 7 character.
                        </Text>
                        <ModalFooter display="flex" justifyContent="center">
                            <Button colorscheme="red" onClick={onChangePassword}
                                style={{ marginTop: "-10px" }}
                            >
                                Confirm
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>

        </div>
    )
}

export default SearchBarComponent;




