"use client"

import { motion } from "framer-motion"
import { Palette, Smartphone, Globe, Code } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const solutions = [
  {
    icon: Palette,
    title: "Graphics Design",
    description: "Stunning visual designs that captivate and convert your audience",
    features: ["Logo Design", "Brand Identity", "Print Design", "Digital Art"],
  },
  {
    icon: Smartphone,
    title: "UI/UX Design",
    description: "User-centered designs that create exceptional digital experiences",
    features: ["User Research", "Wireframing", "Prototyping", "User Testing"],
  },
  {
    icon: Globe,
    title: "Website Development",
    description: "Modern, responsive websites built with cutting-edge technology",
    features: ["Responsive Design", "SEO Optimization", "Performance", "Security"],
  },
  {
    icon: Code,
    title: "App Development",
    description: "Native and cross-platform mobile applications",
    features: ["iOS Development", "Android Development", "React Native", "Flutter"],
  },
]

export function ITSolutions() {
  return (
    <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            IT <span className="text-purple-500">Solutions</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive digital solutions to transform your business and elevate your brand
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gray-900/50 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                    <solution.icon className="w-8 h-8 text-purple-500" />
                  </div>
                  <CardTitle className="text-white text-xl">{solution.title}</CardTitle>
                  <CardDescription className="text-gray-400">{solution.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {solution.features.map((feature) => (
                      <li key={feature} className="text-gray-300 text-sm flex items-center">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
