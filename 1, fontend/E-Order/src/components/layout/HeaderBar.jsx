import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutAction } from "../../action/userAction";
import {
    // Text,
    Avatar, AvatarBadge, Spinner, Menu,
    MenuButton,
    MenuList,
    MenuItem,
    // MenuDivider,
    // Badge
} from '@chakra-ui/react'
import { AiOutlineLogout } from 'react-icons/ai';
// import { Image } from '@chakra-ui/react'
// import { logo } from '../components/logo.png'

const HeaderBar = (props) => {
    const { pathname } = window.location;
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { username } = useSelector((state) => {
        return {
            username: state.userReducer.username
        }

    })
    // console.log('data username di selector HeaderBar', username)

    return (
        <div className="bg-dark">
            <nav className="navbar navbar-expand-xl navbar-light bg-warning">
                <div className="container-fluid">

                    <div className="btn">
                        <div className="row d-flex align-items-center bd-highlight"
                            onClick={() => navigate('/')}
                        >
                            <strong className="col-3 m-0 p-0">
                                Qweeck
                            </strong>
                        </div>

                    </div>
                    {
                        props.loading ? <Spinner /> :
                            username && !props.loading ?
                                <Menu>
                                    <MenuButton>
                                        <div className='d-flex align-items-center'>

                                            <Avatar name={username} size='md'>
                                                <AvatarBadge boxSize='1em' bg='green.500' />
                                            </Avatar>
                                        </div>
                                    </MenuButton>
                                    <MenuList textColor='black'>
                                        <MenuItem onClick={() => navigate('/e-order/profile/setting')}>Sesuaikan Profil</MenuItem>
                                        <MenuItem >Tentang Kami</MenuItem>
                                        <MenuItem >Bantuan</MenuItem>
                                        <MenuItem onClick={() => { dispatch(logoutAction()); navigate('/'); }}>Keluar<AiOutlineLogout className='ms-2' /></MenuItem>
                                    </MenuList>
                                </Menu>
                                :
                                <div className='btn-group'>
                                    <button className='btn btn-warning btn-outline-dark'
                                        type='button'
                                        onClick={() => navigate('/e-order/login')}>
                                        Masuk
                                    </button>
                                    <button className='btn btn-light btn-outline-dark'
                                        type='button'
                                        onClick={() => navigate('/e-order/register')}>
                                        Buat Akun
                                    </button>
                                </div>
                    }
                    {/* <button className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarBasic"
                        aria-controls="navbarBasic"
                        aria-expanded="false"
                        href='#Navbar'
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button> */}
                    {/* <div className="collapse navbar-collapse" id="navbarBasic">
                        <ul className="navbar-nav me-auto mb-2 mb-sm-0">
                            <li className="nav-item">
                                <a className="nav-link active"
                                    aria-current="page"
                                    href="#"
                                >
                                    Keluar
                                </a>
                            </li>
                        </ul>
                    </div> */}
                </div>
            </nav>
        </div>
    )
}

export default HeaderBar;



