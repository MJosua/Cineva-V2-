import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Axios from "axios";
import { API_URL } from "../../config";

function IncomingOrderComponent({
    userToken,
    seasonOut,
    formatNumberWithDots,
    optiontype,
    week,
    optionWeek,
    datetype
}) {
    const chartContainer = useRef(null);
    const chartInstance = useRef(null);


    const [incomingOrder, setIncomingOrder] = useState([])
    const [po_year, setPo_year] = useState([]);
    const [po_date, setPo_date] = useState(["21 / 20"]);
    const [po_volume, setPo_volume] = useState([0, 1]);
    const getIncomingOrder = () => {
        Axios.get(`${API_URL}/spectator/line-graph/${optiontype}?show_by=${optionWeek}`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setIncomingOrder(res.data);
                const poDates = res.data.map(item => item.po_date);
                setPo_date(poDates);
                const poVolume = res.data.map(item => item.volume);
                setPo_volume(poVolume);
            })
            .catch((err) => {
            });
           
    };

    useEffect(() => {
        getIncomingOrder();
    }, [optiontype, optionWeek]);

    useEffect(() => {
        if (chartInstance.current !== null) {
            chartInstance.current.destroy();
        }
        if (chartContainer.current !== null) {
            const ctx = chartContainer.current.getContext('2d');
            Chart.register(ChartDataLabels);
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: po_date,
                    datasets: [{
                        label: 'Sales',
                        data: po_volume.map(value => value ),
                        fill: false,
                        borderColor: '#274DA0',
                        borderWidth: 2,
                        pointBackgroundColor: 'blue',
                        pointRadius: 1,
                        pointHoverRadius: 3,
                        cubicInterpolationMode: 'monotone',
                        pointStyle: 'circle',
                        pointLabelFontColor: 'black',
                        tension: 0.1
                    }]
                },
                options: {
                    layout: {
                        padding: {
                            top: 20,
                            left: 5
                        }
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                    scales: {
                        y: {
                            display: false
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                maxRotation: 0,
                                minRotation: 0,
                                fontSize: 10,
                                autoSkip: false,
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: true
                        },
                        datalabels: {
                            align: 'top',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: 4,
                            color: 'black',
                            font: {
                                weight: 'bold'
                            },
                            formatter: (value, context) => formatNumberWithDots(context.chart.data.datasets[context.datasetIndex].data[context.dataIndex]),
                            display: 'auto',
                        }
                    }
                }
            });
        }
    }, [optiontype, po_date, po_volume, optionWeek]);

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12 text-start grey_text_16px mb-2">
                    INCOMING ORDER
                </div>
                <div className='col-12 mb-2'>
                    <div className="col-12 px-0 py-1 shadow-inset border_radius_10px">
                        <canvas ref={chartContainer} width="100%" height="190"></canvas>
                    </div>
                </div>



            </div>
        </div>
    )
}

export default IncomingOrderComponent;
