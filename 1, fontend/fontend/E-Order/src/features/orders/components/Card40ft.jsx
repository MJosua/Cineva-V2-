import React, { useState } from 'react';
import {
    Image,
    Radio,
    RadioGroup,
    useRadio,
    useRadioGroup,
    Flex,
    FormControl,
    NumberInput,
    NumberInputField,
    NumberDecrementStepper,
    NumberIncrementStepper,
    Box
} from '@chakra-ui/react';

const Card40ft = () => {

    const [counter_3, setCounter_3] = useState(0);
    const [counter_4, setCounter_4] = useState(0);

    const [value, setValue] = useState(1);

    return (
        <RadioGroup
            onChange={setValue}
            value={value}>
            <Radio value='1'>
                <div className='row p-2'>
                    <div className='position-relative col-1 circle_icon'>

                        {/* <svg className="Icon_ionic-ios-radio-button-of position-absolute top-50 start-0 translate-middle" viewBox="3.375 3.375 15 15">
                            <path id="Icon_ionic-ios-radio-button-of" d="M 10.87500095367432 4.384615421295166 C 12.609375 4.384615421295166 14.23918342590332 5.058894157409668 15.46514511108398 6.28485631942749 C 16.69110679626465 7.510818004608154 17.36538505554199 9.140625 17.36538505554199 10.87500095367432 C 17.36538505554199 12.609375 16.69110679626465 14.23918342590332 15.46514511108398 15.46514511108398 C 14.23918342590332 16.69110679626465 12.609375 17.36538505554199 10.87500095367432 17.36538505554199 C 9.140625 17.36538505554199 7.510818004608154 16.69110679626465 6.28485631942749 15.46514511108398 C 5.058894157409668 14.23918342590332 4.384615421295166 12.609375 4.384615421295166 10.87500095367432 C 4.384615421295166 9.140625953674316 5.058894157409668 7.510818004608154 6.28485631942749 6.28485631942749 C 7.510818004608154 5.058894157409668 9.140625 4.384615421295166 10.87500095367432 4.384615421295166 M 10.87500095367432 3.375 C 6.731971740722656 3.375 3.375 6.731971740722656 3.375 10.87500095367432 C 3.375 15.01803016662598 6.731971740722656 18.375 10.87500095367432 18.375 C 15.01803016662598 18.375 18.375 15.01803016662598 18.375 10.87500095367432 C 18.375 6.731971263885498 15.01803016662598 3.375 10.87500095367432 3.375 L 10.87500095367432 3.375 Z">
                            </path>
                        </svg> */}
                    </div>
                    <div className='col-11'>
                        <div className='card-body border border-secondary change_quantity shadow row'>
                            <div className="col-4 p-1 ">
                                <Image
                                    // key={state.product.code}
                                    className="d-flex justify-content-center border rounded-3"
                                    src={require('../../../../assets/images/indomie-mi-goreng-special_detail.png')}
                                    boxSize=''
                                    // alt={state.product_code}
                                    width='95%'
                                    fallbacksrc={require('../../../../assets/images/indomie-mi-goreng-special_detail.png')}>
                                </Image>
                            </div>

                            <div className="col-8 py-1 ">
                                <div className='add_product_product_text'>
                                    MI INSTAN IND. GORENG SPECIAL PLUS
                                </div>

                                <div className="row py-2">
                                    <div className="col-5 d-flex add_product_est_price">
                                        Est. Price
                                    </div>

                                    <div className="col-7 add_product_price_tag">
                                        $5.60/ctn
                                    </div>
                                </div>

                                <div className='row'>
                                    <div className='col-2'></div>
                                    <div className='col-10'>
                                        <div className="py-2 form-container">
                                            <FormControl>
                                                <NumberInput value={counter_3} onChange={(value) => setCounter_3(value)} step={100} max={5000} min={0}>
                                                    <NumberDecrementStepper
                                                        sx={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: "2.5rem",
                                                            height: "2.5rem",
                                                            fontSize: "1.25rem",
                                                            fontWeight: "bold",
                                                            color: counter_3 > 0 ? "gray.800" : "gray.400",
                                                            bg: "white",
                                                            border: "1px",
                                                            borderColor: "gray.200",
                                                            borderRadius: "0.375rem",
                                                            _hover: {
                                                                bg: counter_3 > 0 ? "gray.100" : "white"
                                                            },
                                                            _active: {
                                                                bg: counter_3 > 0 ? "gray.200" : "white"
                                                            },
                                                            _focus: {
                                                                boxShadow: "outline"
                                                            }
                                                        }}
                                                        isDisabled={counter_3 === 0}
                                                        onClick={() => {
                                                            setCounter_3(counter_3);
                                                        }}
                                                    >
                                                        -
                                                    </NumberDecrementStepper>
                                                    <NumberInputField
                                                        sx={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: "7rem",
                                                            height: "2.5rem",
                                                            fontSize: "1.25rem"
                                                        }}
                                                        {...counter_3}
                                                    />
                                                    <NumberIncrementStepper
                                                        sx={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: "2.5rem",
                                                            height: "2.5rem",
                                                            fontSize: "1.25rem",
                                                            fontWeight: "bold",
                                                            color: counter_3 > 0 ? "gray.800" : "gray.400",
                                                            bg: "white",
                                                            border: "1px",
                                                            borderColor: "gray.200",
                                                            borderRadius: "0.375rem",
                                                            _hover: {
                                                                bg: counter_3 > 0 ? "gray.100" : "white"
                                                            },
                                                            _active: {
                                                                bg: counter_3 > 0 ? "gray.200" : "white"
                                                            },
                                                            _focus: {
                                                                boxShadow: "outline"
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            setCounter_3(counter_3);
                                                        }}
                                                    >
                                                        +
                                                    </NumberIncrementStepper>
                                                </NumberInput>
                                            </FormControl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Radio>
            <Radio value='2'>
                <div className='row p-2'>
                    <div className='col-1 position-relative circle_icon'>
                        {/* <svg className="Icon_ionic-ios-radio-button-of position-absolute top-50 start-0 translate-middle" viewBox="3.375 3.375 15 15">
                                    <path id="Icon_ionic-ios-radio-button-of" d="M 10.87500095367432 4.384615421295166 C 12.609375 4.384615421295166 14.23918342590332 5.058894157409668 15.46514511108398 6.28485631942749 C 16.69110679626465 7.510818004608154 17.36538505554199 9.140625 17.36538505554199 10.87500095367432 C 17.36538505554199 12.609375 16.69110679626465 14.23918342590332 15.46514511108398 15.46514511108398 C 14.23918342590332 16.69110679626465 12.609375 17.36538505554199 10.87500095367432 17.36538505554199 C 9.140625 17.36538505554199 7.510818004608154 16.69110679626465 6.28485631942749 15.46514511108398 C 5.058894157409668 14.23918342590332 4.384615421295166 12.609375 4.384615421295166 10.87500095367432 C 4.384615421295166 9.140625953674316 5.058894157409668 7.510818004608154 6.28485631942749 6.28485631942749 C 7.510818004608154 5.058894157409668 9.140625 4.384615421295166 10.87500095367432 4.384615421295166 M 10.87500095367432 3.375 C 6.731971740722656 3.375 3.375 6.731971740722656 3.375 10.87500095367432 C 3.375 15.01803016662598 6.731971740722656 18.375 10.87500095367432 18.375 C 15.01803016662598 18.375 18.375 15.01803016662598 18.375 10.87500095367432 C 18.375 6.731971263885498 15.01803016662598 3.375 10.87500095367432 3.375 L 10.87500095367432 3.375 Z">
                                    </path>
                                </svg> */}
                    </div>
                    <div className='col-11'>
                        <div className='card-body border border-secondary change_quantity shadow row'>
                            <div className="col-4 p-1 ">
                                <Image
                                    // key={state.product.code}
                                    className="d-flex justify-content-center border rounded-3"
                                    src={require('../../../../assets/images/indomie-mi-goreng-special_detail.png')}
                                    boxSize=''
                                    // alt={state.product_code}
                                    width='95%'
                                    fallbacksrc={require('../../../../assets/images/indomie-mi-goreng-special_detail.png')}>
                                </Image>
                            </div>

                            <div className="col-8 py-1 ">
                                <div className='add_product_product_text'>
                                    MI INSTAN IND. GORENG RASA IGA PENYET
                                </div>

                                <div className="row py-2">
                                    <div className="col-5 d-flex add_product_est_price">
                                        Est. Price
                                    </div>

                                    <div className="col-7 add_product_price_tag">
                                        $6.05/ctn
                                    </div>
                                </div>

                                <div className='row'>
                                    <div className='col-2'></div>
                                    <div className='col-10'>
                                        <div className="py-2 form-container">
                                            <FormControl>
                                                <NumberInput value={counter_4} onChange={(value) => setCounter_4(value)} step={100} max={5000} min={0}>
                                                    <NumberDecrementStepper
                                                        sx={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: "2.5rem",
                                                            height: "2.5rem",
                                                            fontSize: "1.25rem",
                                                            fontWeight: "bold",
                                                            color: counter_4 > 0 ? "gray.800" : "gray.400",
                                                            bg: "white",
                                                            border: "1px",
                                                            borderColor: "gray.200",
                                                            borderRadius: "0.375rem",
                                                            _hover: {
                                                                bg: counter_4 > 0 ? "gray.100" : "white"
                                                            },
                                                            _active: {
                                                                bg: counter_4 > 0 ? "gray.200" : "white"
                                                            },
                                                            _focus: {
                                                                boxShadow: "outline"
                                                            }
                                                        }}
                                                        isDisabled={counter_4 === 0}
                                                        onClick={() => {
                                                            setCounter_4(counter_4);
                                                        }}
                                                    >
                                                        -
                                                    </NumberDecrementStepper>
                                                    <NumberInputField
                                                        sx={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: "7rem",
                                                            height: "2.5rem",
                                                            fontSize: "1.25rem"
                                                        }}
                                                        {...counter_4}
                                                    />
                                                    <NumberIncrementStepper
                                                        sx={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: "2.5rem",
                                                            height: "2.5rem",
                                                            fontSize: "1.25rem",
                                                            fontWeight: "bold",
                                                            color: counter_4 > 0 ? "gray.800" : "gray.400",
                                                            bg: "white",
                                                            border: "1px",
                                                            borderColor: "gray.200",
                                                            borderRadius: "0.375rem",
                                                            _hover: {
                                                                bg: counter_4 > 0 ? "gray.100" : "white"
                                                            },
                                                            _active: {
                                                                bg: counter_4 > 0 ? "gray.200" : "white"
                                                            },
                                                            _focus: {
                                                                boxShadow: "outline"
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            setCounter_4(counter_4);
                                                        }}
                                                    >
                                                        +
                                                    </NumberIncrementStepper>
                                                </NumberInput>
                                            </FormControl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Radio>
        </RadioGroup>
    )
};

export default Card40ft;



