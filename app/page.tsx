import { Hero } from "@/components/hero"
import { ITSolutions } from "@/components/it-solutions"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <Hero />
      <ITSolutions />
      <Footer />
    </div>
  )
}
