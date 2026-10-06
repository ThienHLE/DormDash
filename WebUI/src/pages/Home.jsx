import { useState } from 'react'
import heroImg from '../assets/hero.png'
import reactLogo from '../assets/react.svg'
import viteLogo from '../assets/vite.svg'
import DelieveryCard from '../components/DelieveryCard'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="bg-primary text-white p-4">If this is blue, the theme works</div>
    </>
  )
}

export default Home;
