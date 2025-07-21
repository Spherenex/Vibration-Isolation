import { useState } from 'react'
import Vibration from '../src/components/vibration'
import './App.css'
import LineFallDetectionDashboard from './components/Linefall'
import SingleAxis from './components/SingleAxis'
import TransformerPrediction from './components/TranformerPrediction'
import TransformerService from './components/TransformerService'
import JetEngineMonitor from './components/Jetdatalog'
import SensorDashboard from './components/SensorDashboard'
import Self_Balancing from './components/Self_Balancing'
import Alzymers from './components/Alzymers'
// import Topics from './components/Topics'
import HealthCheck from './components/Healthcare'
import Swatch_Bharath from './components/Swatch_Bharath'
import Illiterate from './components/Illiterate'
import Home from './components/Home-gas-moisture'
import Waste_detection from './components/Waste_Detection'
import UV from './components/UV'
import Vibration_Isolation from './components/Vibratio_Isolation'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <Vibration/> */}
      {/* <LineFallDetectionDashboard /> */}
      {/* <SingleAxis/> */}
      {/* <TransformerPrediction /> */}
      {/* <TransformerService /> */}
      {/* <JetEngineMonitor /> */}
      {/* <SensorDashboard /> */}
      {/* <Self_Balancing /> */}
      {/* <Alzymers /> */}
      {/* <Topics /> */}
      {/* <HealthCheck /> */}
      {/* <Swatch_Bharath /> */}
      {/* <Illiterate /> */}
      {/* <Home/> */}
      {/* <Waste_detection /> */}
      {/* <UV/> */}
      <Vibration_Isolation />
    </>
  )
}

export default App