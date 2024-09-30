import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-moment'; 
import Chart from 'chart.js/auto';
import { CategoryScale } from 'chart.js';

Chart.register(CategoryScale);

// Function to load initial chart data from localStorage
const loadInitialChartData = (coin) => {
  const savedData = localStorage.getItem(`chartData-${coin}`);
  return savedData ? JSON.parse(savedData) : {};
};

// Save chart data to localStorage
const saveToLocalStorage = (coin, data) => {
  localStorage.setItem(`chartData-${coin}`, JSON.stringify(data[coin]));
};

const BinanceWebSocket = () => {
  const [selectedCoin, setSelectedCoin] = useState('ethusdt');
  const [timeframe, setTimeframe] = useState('1m');
  const [chartData, setChartData] = useState(loadInitialChartData('ethusdt')); // Load data from localStorage if available
  const socketRef = useRef(null);

  const coins = [
    { id: 'ethusdt', label: 'ETH/USDT' },
    { id: 'bnbusdt', label: 'BNB/USDT' },
    { id: 'dotusdt', label: 'DOT/USDT' },
  ];

  const timeframes = ['1m', '3m', '5m'];

  // Connect to WebSocket for Binance Market Data
  const connectToWebSocket = () => {
    const url = `wss://stream.binance.com:9443/ws/${selectedCoin}@kline_${timeframe}`;
    socketRef.current = new WebSocket(url);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const candlestick = data.k;
      const time = candlestick.t;
      const open = parseFloat(candlestick.o);
      const close = parseFloat(candlestick.c);
      const high = parseFloat(candlestick.h);
      const low = parseFloat(candlestick.l);

      const updatedChartData = {
        ...chartData,
        [selectedCoin]: [
          ...(chartData[selectedCoin] || []),
          { time, open, high, low, close },
        ],
      };

      setChartData(updatedChartData);
      saveToLocalStorage(selectedCoin, updatedChartData); // Save to localStorage
    };
  };
  // const connectToWebSocket = () => {
  //   const url = `wss://stream.binance.com:9443/ws/${selectedCoin}@kline_${timeframe}`;
  //   socketRef.current = new WebSocket(url);

  //   socketRef.current.onmessage = (event) => {
  //     const data = JSON.parse(event.data);
  //     const time = candlestick.t;
  //     const open = parseFloat(candlestick.o);
  //     const close = parseFloat(candlestick.c);
  //     const high = parseFloat(candlestick.h);
  //     const low = parseFloat(candlestick.l);

  //     const updatedChartData = {
  //       ...chartData,
  //       [selectedCoin]: [
  //         ...(chartData[selectedCoin] || []),
  //         { time },
  //       ],
  //     };

  //     setChartData(updatedChartData);
  //     saveToLocalStorage(selectedCoin, updatedChartData); // Save to localStorage
  //   };
  // };

  // Reconnect WebSocket when selectedCoin or timeframe changes
  useEffect(() => {
    const savedData = loadInitialChartData(selectedCoin);
    if (savedData[selectedCoin]) {
      setChartData(savedData);
    } else {
      connectToWebSocket(); 
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [selectedCoin, timeframe]);

  const handleCoinChange = (coin) => {
    setSelectedCoin(coin);
  };

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
  };

  // Chart configuration
  const chartOptions = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
        },
      },
    },
  };

  const chartLabels = chartData[selectedCoin]?.map((data) => data.time) || [];
  const chartValues = chartData[selectedCoin]?.map((data) => data.close) || [];

  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: `${selectedCoin.toUpperCase()} - ${timeframe}`,
        data: chartValues,
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
    // datasets: [
    //   {
    //     label: `${selectedCoin.toUpperCase()} - ${timeframe}`,
    //     data: chartValues,
    //     fill: true,
    //     borderColor: 'rgba(75,192,192,1)',
    //     tension: 0.1,
    //   },
    // ],
  };

  return (
    <div className="container">
      <h2 className="title">Binance Market Data</h2>

      <div className="toggle-group">
        {coins.map((coin) => (
          <button
            key={coin.id}
            className={`toggle-button ${selectedCoin === coin.id ? 'active' : ''}`}
            onClick={() => handleCoinChange(coin.id)}
          >
            {coin.label}
          </button>
        ))}
      </div>

      {/* Timeframe Selection */}
      <div className="timeframe-group">
        <label>Select Timeframe: </label>
        <select value={timeframe} onChange={handleTimeframeChange}>
          {timeframes.map((frame) => (
            <option key={frame} value={frame}>
              {frame}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <Line data={data} options={chartOptions} />
      </div>

      <footer>
        <p>Powered by Binance WebSocket</p>
      </footer>
    </div>
  );
};

export default BinanceWebSocket;
