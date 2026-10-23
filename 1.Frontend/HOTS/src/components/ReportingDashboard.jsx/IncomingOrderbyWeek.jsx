import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Axios from 'axios';
import { API_URL } from '../../config';
import { useSelector } from 'react-redux';
function IncomingOrderbyWeek({ userToken, seasonOut, formatNumberWithDots, optiontype, week, datetype }) {
  const chartContainer = useRef(null);
  const chartInstance = useRef(null);

  const { user } = useSelector((state) => {
    return {
        user: state.userReducer.user,
    }
});

  const [dataWeekly, setdataWeekly] = useState([])
  const getDataWeekly = () => {
    Axios.get(API_URL + `/spectator/total_order_week/${optiontype}`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        // console.log("dataWeekly", res.data.results);
        const poVolume = res.data.results.map(item => item.volume);
        // console.log("Volumes:", poVolume);
        setdataWeekly(poVolume);

      })
      .catch((err) => {
        // Handle errors
        console.error("Error fetching data:", err);
      });
  };

  useEffect(() => {
    // Destroy the previous chart instance if it exists
    if (chartInstance.current !== null) {
      chartInstance.current.destroy();
    }

    // Create a new chart only if the chart container is available
    if (chartContainer.current !== null) {
      const ctx = chartContainer.current.getContext('2d');
      Chart.register(ChartDataLabels);
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Array.from({ length: 52 }, (_, index) => (index + 1).toString()),
          datasets: [{
            label: 'Sales',
            data: dataWeekly,
            borderColor: '#274DA0',
            borderWidth: 2,
            pointBackgroundColor: 'blue',
            pointRadius: 1,
            pointHoverRadius: 3,
            cubicInterpolationMode: 'monotone',
            pointStyle: 'circle',
            pointLabelFontColor: 'black',
            backgroundColor: "274DA0",
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
  }, [dataWeekly,user]); // Add dataWeekly as a dependency

  // Fetch data on component mount
  useEffect(() => {
    getDataWeekly();
  }, [optiontype,user]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 text-start grey_text_16px mb-2">
          INCOMING ORDER BY WEEK
        </div>
        <div className='col-12 mb-2 overflow-x '>
          <div className="col-12 px-0 chart-container py-1 shadow-inset border_radius_10px"
          >
            <canvas ref={chartContainer} height="190"></canvas>
          </div>
        </div>


      </div>
    </div>
  )
}

export default IncomingOrderbyWeek
