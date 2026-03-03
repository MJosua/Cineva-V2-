import { Button, Input, Select, Tooltip, useToast } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { BsFillPlusCircleFill } from 'react-icons/bs';
import Axios from 'axios';
import { API_URL } from "../../../../config";
import { AiFillCloseCircle } from 'react-icons/ai';
import { CopyIcon } from '@chakra-ui/icons';
import { useSelector } from 'react-redux';
import { RumuscbmTruck } from '../RumuscbmTruck';
function toRoman(num) {
  const romanNumerals = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1
  };

  let result = '';

  for (let key in romanNumerals) {
    while (num >= romanNumerals[key]) {
      result += key;
      num -= romanNumerals[key];
    }
  }

  return result;
}

const formatNumber = (value) => {
  if (value === '') return '';
  if (value === undefined) return '';
  return parseFloat(value).toLocaleString(); // Format number with commas
};



function AddMoreTruckBody({
  truckOrders,
  flavours,
  order,
  orderIndex,
  setTruckOrders,
  userToken,
  reset,
  incrementPoBuyer,
}) {


  const toast = useToast();

  const addMoreFlavors = (orderIndex) => {
    const newOrders = [...truckOrders];
    newOrders[orderIndex].flavors.push({
      sku: '',
      skuName: '',
      qty: 0
    });
    setTruckOrders(newOrders);
  };


  const { company_id, max_flavour_truck } = useSelector((state) => {
    return {
      company_id: state.userReducer.company_id,
      max_flavour_truck: state.userReducer.max_flavour_truck,
    };
  });

  const removeFlavor = (orderIndex, flavorIndex) => {
    const newOrders = [...truckOrders];
    newOrders[orderIndex].flavors.splice(flavorIndex, 1);
    setTruckOrders(newOrders);
  };

  const handleFlavorQtyChange = (orderIndex, flavorIndex, value) => {
    const newOrders = [...truckOrders];
    const qty = parseInt(value);
    if (!isNaN(qty) && qty >= 0) {
      if (newOrders[orderIndex]?.flavors && newOrders[orderIndex].flavors[flavorIndex]) {
        newOrders[orderIndex].flavors[flavorIndex].qty = qty.toString();
        setTruckOrders(newOrders);
        sessionStorage.setItem('truckOrders', JSON.stringify(newOrders));
      }
    }
  };


  const handleRemarkChange = (orderIndex, value) => {
    const newOrders = [...truckOrders];
    newOrders[orderIndex].remark = value;
    setTruckOrders(newOrders);
  }

  const removeOrder = (index) => {
    const newOrders = [...truckOrders];
    newOrders.splice(index, 1);
    setTruckOrders(newOrders);
  };


  const flavorLookup = flavours.reduce((lookup, flavor) => {
    lookup[flavor.product_code] = flavor;
    return lookup;
  }, {});

  const handleFlavorIdChange = (orderIndex, flavorIndex, value) => {
    const newOrders = [...truckOrders];
    const selectedFlavor = flavorLookup[value];
    console.log("flavourData", selectedFlavor)

    newOrders[orderIndex].flavors[flavorIndex] = {
      sku: value,
      qty: 0,
      moq: selectedFlavor.truck_moq,
      ctn_load: selectedFlavor.cont40hc,
    };
    console.log("selectedFlavor", selectedFlavor)
    setTruckOrders(newOrders);
  };

  const validateInputRemark = (value) => {
    // Simple validation example: allow only alphanumeric characters and some special characters
    const regex = /^[a-zA-Z0-9\s\/\\\-_(),.]*$/
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


  const duplicateOrder = (data) => {


    let newPoBuyer = ""


    if (truckOrders.length > 0) {
      const lastOrder = truckOrders[truckOrders.length - 1];
      if (lastOrder.po_buyer) {
        newPoBuyer = incrementPoBuyer(data.po_buyer);
      }



    }

    if (truckOrders.length < 20) {
      setTruckOrders([...truckOrders, {

        po_buyer: newPoBuyer,
        po_url: "",
        delv_date: data.delv_date,
        port: data.port,
        shipToParty: data.shipToParty,
        shipToPartyIndex: data.shipToPartyIndex,
        notify_to_1: data.notify_to_1,
        notify_to_2: data.notify_to_2,
        bill_to: data.bill_to,
        final_dest: data.final_dest,
        detail_id: truckOrders.length,
        flavors: data.flavors.map(flavor => ({
          sku: flavor.sku,
          qty: flavor.qty,
          moq: flavor.moq,
          ctn_load: flavor.ctn_load,
        })),
        remark: data.remark,

      }]);



    }

  };



  return (
    <div className='container px-5 mb-4 '>

      {order.cart_id ?
        <>
        </>
        :
        <div className="col-12 top-0 position-absolute d-flex justify-content-end me-5 pe-4">
          <Tooltip label="Duplicate this order">
            <Button
              size="sm"
              className="mt-2 me-5"
              onClick={() => { duplicateOrder(order) }}

            >
              <CopyIcon />
            </Button>
          </Tooltip>
        </div>
      }

      <button
        className={orderIndex !== 0 ? "position-absolute top-0 start-100 translate-middle" : "d-none"}
        onClick={() => removeOrder(orderIndex)}
      >
        <AiFillCloseCircle className="remove_cont_button" size={30} />
      </button>
      <div className='row  pt-3 '>
        <div className="card-body border border_radius_10px shadow shadow-sm mt-3 ">

          <div className="row px-4  pt-3">
            <div className='col-2 colspan'>
              <RumuscbmTruck
                flavours={flavours}
                containerOrders={truckOrders}
                container={order}
              />
            </div>
            <div className='col-3  offset-md-7  text-grey text-end'>
              Total qty (ctns)
            </div>


          </div>


          {order.flavors.map((flavor, flavorIndex) => (
            <div className="row d-flex px-4 mt-3" key={flavorIndex}>



              <div className="grey_text_bold fs-6 d-flex align-items-center col-md-2 px-0">
                <div className="position-absolute ">
                  Flavour &nbsp;{toRoman(flavorIndex + 1)}

                  {flavorIndex === 0 ?
                    <span className="color_red">
                      *
                    </span>
                    :
                    ""
                  }

                </div>
              </div>
              <div className="col-8  px-4 " >

                <Select
                  className="grey_text fs-6"
                  size="sm"
                  value={flavor.sku}
                  onChange={(e) => handleFlavorIdChange(orderIndex, flavorIndex, e.target.value)}
                  placeholder='Choose Flavour'
                  disabled={flavorIndex === 0 ? false :
                    (!order.flavors[flavorIndex - 1]?.sku || !order.flavors[flavorIndex - 1]?.qty)

                  } // Disable if previous flavor is not picked, except for orderIndex 0

                >

                  {flavours
                    .sort((a, b) => a.cat_name.localeCompare(b.cat_name))
                    .map((flavour, index) => {
                      // Check if this flavour is the currently selected one in the dropdown
                      const isSelected = flavor.sku === flavour.product_code.toString();

                      // Always render the currently selected flavour, regardless of its selection status
                      if (isSelected) {
                        return (
                          <option key={index} value={flavour.product_code}>
                            {flavour.product_name_complete}
                          </option>
                        );
                      } else {
                        // Check if this flavour is already selected in truckOrders
                        const isAlreadySelected = truckOrders[orderIndex].flavors.some(truck => truck.sku === flavour.product_code.toString());

                        // Render the option only if it's not already selected
                        if (!isAlreadySelected) {
                          return (
                            <option key={index} value={flavour.product_code}>
                              {flavour.product_name_complete}
                            </option>
                          );
                        } else {
                          return null; // Return null if the flavour is already selected
                        }
                      }
                    })
                  }

                </Select>


              </div>

              <div className='col-2 position-relative'>
                <Input
                  size="sm"
                  type="text"
                  className='text-center'
                  disabled={

                    !flavor.sku || flavor.sku === '' || flavor.sku.toLocaleString() === '0' || flavor.sku === "0"

                  }
                  value={formatNumber(flavor.qty)} // Format number with commas
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, ''); // Remove commas from input
                    if (!isNaN(value)) { // Check if the value is a valid number
                      handleFlavorQtyChange(orderIndex, flavorIndex, value); // Update state
                    }
                  }} />

                <button
                  className={flavorIndex !== 0 ? " position-absolute top-0 mt-1  translate-middle" : "d-none"}
                  onClick={() => removeFlavor(orderIndex, flavorIndex)}
                  style={{ width: 20 }}
                >
                  <AiFillCloseCircle
                    className="text-danger"
                    size={20}
                  />
                </button>
              </div>

              {flavor.sku !== "" || flavor.qty !== 0 ?
                <>
                  <div className="row">
                    <div className="col-4 col-md-2"></div>


                    <div className="d-flex fw-bold red_info_text col-6 ps-4">
                      {
                        // zachary 147
                        // tryfon 381
                        // ascoo.foods 381
                        ((company_id === 147 || company_id === 381 || company_id === 266) && flavor.moq) ?
                          `* ` : ""
                      }

                      {
                        flavor.ctn_load && (company_id === 147 || company_id === 381) ?
                          `Container Loads : ${flavor.ctn_load} ctns | ` : ""
                      }
                      {
                        flavor.moq.toLocaleString() !== "0" &&
                        `MOQ : ${flavor.moq.toLocaleString()} ctns`

                      }
                    </div>
                  </div>


                </>
                :
                ""
              }

            </div>
          ))}

          <div className="row d-flex px-4 mt-3">
            <div className="grey_text_bold fs-6 d-flex align-items-center col-md-2 px-0">
              <div className="position-absolute ">
                Remark
              </div>
            </div>

            <div className="col-10  ps-4" >
              <Input
                value={order.remark}
                onChange={(e) => {
                  const value = e.target.value;
                  if (validateInputRemark(value)) {
                    handleRemarkChange(orderIndex, value)
                  }
                }}
                size="sm"
              />

            </div>


          </div>
          <div className='px-2 pb-4 col-12 d-flex justify-content-start mt-4 pt-1 '>
            <Tooltip
              label={`Maximum ${max_flavour_truck ? max_flavour_truck : 7} Flavours`}
              hasArrow
              arrowSize={15}
            >
              <button
                onClick={(e) => addMoreFlavors(orderIndex)}
                className={
                  "btn btn-danger py-1  border_radius_10px"
                }
                disabled={order.flavors.length >= (!max_flavour_truck || max_flavour_truck === 0 ? 7 : max_flavour_truck)}
              >
                <div className="row">
                  <div className="col-2 pt-1 py-0">
                    <BsFillPlusCircleFill />
                  </div>
                  <div className="col-10">
                    Add Flavour
                  </div>
                </div>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div >
  );
}

export default AddMoreTruckBody;





