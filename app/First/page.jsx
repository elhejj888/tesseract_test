import RealTimeOCR from "@/components/RealTimeOCR";
import React from 'react';


const Home = () => {
    return (
      <div className="bg-white">
        <h1>Real-Time Text Detection</h1>
        <RealTimeOCR />
      </div>
    );
  };
  
  export default Home;