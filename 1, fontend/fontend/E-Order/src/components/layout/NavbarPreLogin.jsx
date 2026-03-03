import React from "react";

import { useDispatch, useSelector } from 'react-redux';


import { useNavigate } from 'react-router-dom'

import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuItemOption,
    MenuGroup,
    MenuOptionGroup,
    MenuDivider,
    Image,
    IconButton,
} from '@chakra-ui/react';


import {
    PlusSquareIcon,
    InfoOutlineIcon,
    ArrowForwardIcon,
    HamburgerIcon,
    AddIcon,
    ExternalLinkIcon,
    RepeatIcon,
    EditIcon
} from '@chakra-ui/icons'

const NavbarPreLogin = () => {

    const navigate = useNavigate()

    const { user_id } = useSelector((state) => {
        return {
            user_id: state.userReducer.user_id
        }
    });


    return (

        <div className="navbarmobile-landingpage mobile-ver">

            <div className="position-fixed top-0 mt-2 ms-2">
                <Image
                    src={require('../../assets/images/indofood_CBP_logo.png')}
                    width='55%'
                    fallbacksrc={require('../../assets/images/indofood_CBP_logo.png')}
                />
            </div>

            <div className='float-right mt-1 d-flex justify-content-end me-2'>
                <Menu>
                    <MenuButton
                        as={IconButton}
                        aria-label='Options'

                        icon={<HamburgerIcon color='white' />}
                        variant='outline'
                    />
                    <MenuList>
                        <MenuItem onClick={() => navigate('/')} icon={<PlusSquareIcon />} >
                            Home
                        </MenuItem>
                        <MenuItem onClick={() => navigate('/')} icon={<EditIcon />} >
                            News & Event
                        </MenuItem>
                        <MenuItem onClick={() => navigate('/')} icon={<ExternalLinkIcon />} >
                            Products
                        </MenuItem>
                        <MenuItem onClick={() => navigate('/')} icon={<InfoOutlineIcon />} >
                            About Us
                        </MenuItem>
                        <MenuItem onClick={() => {
                            user_id === null ?
                                navigate('/e-order/login')
                                :
                                navigate('/e-order/dashboard') 
                        }} icon={<ArrowForwardIcon />} >
                            Login
                        </MenuItem> 
                    </MenuList>
                </Menu>
            </div>
        </div>
    )
}
export default NavbarPreLogin



