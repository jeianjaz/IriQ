"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Define slides
  const slides = [
    {
      id: 'home',
      title: 'Home',
      content: (
        <div className="h-full flex flex-col justify-center items-center bg-white">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center text-center">
            <div className="mx-auto max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                <span className="text-[#002E1F]">Cultivating</span> 
                <span className="text-[#002E1F]"> a </span>
                <span className="text-[#7AD63D]">Greener Future</span>
                <br />
                <span className="text-[#002E1F]">Through </span>
                <span className="text-[#002E1F] italic">Sustainable</span>
              </h1>
              <h2 className="text-[#7AD63D] text-6xl md:text-7xl lg:text-8xl font-bold mt-4 tracking-wide">AGRICULTURE</h2>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'about',
      title: 'About Us',
      content: (
        <div className="h-full flex flex-col justify-center items-center bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-5xl md:text-6xl font-extrabold text-[#002E1F] mb-10 tracking-tight">OUR MISSION</h2>
            <div className="space-y-8">
              <p className="text-2xl md:text-3xl lg:text-4xl leading-tight font-light text-gray-700">
                <span className="text-[#7AD63D] font-medium block text-4xl md:text-5xl mb-6">At IriQ, we revolutionize agriculture</span>
                with sustainable practices and innovative technologies.
              </p>
              <p className="text-2xl md:text-3xl lg:text-4xl leading-tight font-light text-gray-700">
                Committed to environmental stewardship and community empowerment, 
                <span className="text-[#7AD63D] font-medium block text-4xl md:text-5xl mt-6">we aim to lead farming towards a sustainable and prosperous future.</span>
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'services',
      title: 'Services',
      content: (
        <div className="h-full flex flex-col justify-center items-center bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-[#002E1F] mb-10 text-center">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#F6F8ED] rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="h-16 w-16 bg-[#7AD63D] rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#002E1F] mb-3">Smart Irrigation</h3>
                <p className="text-gray-700 text-lg">Automated systems that optimize water usage based on real-time soil conditions</p>
              </div>
              
              <div className="bg-[#F6F8ED] rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="h-16 w-16 bg-[#7AD63D] rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#002E1F] mb-3">Data Analytics</h3>
                <p className="text-gray-700 text-lg">Comprehensive insights from soil moisture data to optimize agricultural practices</p>
              </div>
              
              <div className="bg-[#F6F8ED] rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="h-16 w-16 bg-[#7AD63D] rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#002E1F] mb-3">Remote Control</h3>
                <p className="text-gray-700 text-lg">Manage your irrigation system from anywhere using our mobile and web applications</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'benefits',
      title: 'Benefits',
      content: (
        <div className="h-full flex flex-col justify-center items-center bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-5xl md:text-6xl font-extrabold text-[#002E1F] mb-12 text-center tracking-tight">WHY CHOOSE IRIQ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-[#F6F8ED] rounded-2xl p-8 border-l-4 border-[#7AD63D] shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-[#7AD63D] h-14 w-14 rounded-full flex items-center justify-center shadow-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-[#002E1F]">Water Conservation</h3>
                </div>
                <p className="text-gray-700 text-xl mb-6 leading-relaxed">Reduce water usage by up to 40% with our precision irrigation technology</p>
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700 text-lg">
                    <svg className="h-6 w-6 text-[#7AD63D] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Smart scheduling based on weather forecasts</span>
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <svg className="h-6 w-6 text-[#7AD63D] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Real-time soil moisture monitoring</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-[#F6F8ED] rounded-2xl p-8 border-l-4 border-[#7AD63D] shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-[#7AD63D] h-14 w-14 rounded-full flex items-center justify-center shadow-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-[#002E1F]">Increased Crop Yield</h3>
                </div>
                <p className="text-gray-700 text-xl mb-6 leading-relaxed">Optimize growing conditions to maximize your harvest potential</p>
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700 text-lg">
                    <svg className="h-6 w-6 text-[#7AD63D] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Prevent over and under-watering</span>
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <svg className="h-6 w-6 text-[#7AD63D] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Data-driven agricultural decisions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  // Navigation handlers
  const goToSlide = (index: number) => {
    setActiveSlide(index)
  }

  const goToPrevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const goToNextSlide = () => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  return (
    <main className={`h-screen flex flex-col ${isMobile ? 'overflow-auto' : 'overflow-hidden'}`}>
      {/* Get Started Button - Fixed at top right */}
      <div className="absolute top-4 right-4 z-50">
        <Link href="/login" className="bg-[#7AD63D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#69c52c] transition-colors shadow-lg flex items-center">
          GET STARTED
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Logo */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50">
        <Image 
          src="/iriqlogo-removebg-preview.png" 
          alt="IriQ Logo" 
          width={150} 
          height={150} 
          priority
          className="drop-shadow-lg"
        />
      </div>

      {/* Main Carousel */}
      <div className="flex-1 relative bg-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/agriculture-pattern.svg')] opacity-5"></div>
        
        {/* Slide Content */}
        <div className="h-full relative z-10">
          {slides[activeSlide].content}
        </div>
        
        {/* Left/Right Navigation Arrows */}
        <button 
          onClick={goToPrevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-[#002E1F] hover:bg-[#002E1F]/80 rounded-full p-3 text-white z-20 shadow-md transition-all"
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          onClick={goToNextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-[#002E1F] hover:bg-[#002E1F]/80 rounded-full p-3 text-white z-20 shadow-md transition-all"
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Bottom Navigation */}
      <nav className="bg-[#002E1F] py-4 px-8 rounded-t-2xl absolute bottom-0 left-1/2 transform -translate-x-1/2 z-50 shadow-lg border-t border-[#7AD63D]/30">
        <div className="flex space-x-10 items-center">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${activeSlide === index ? 'text-white bg-[#7AD63D] shadow-md' : 'text-white/90 hover:text-white hover:bg-[#7AD63D]/20'}`}
            >
              {slide.title}
            </button>
          ))}
        </div>
      </nav>
      
      {/* Mobile Scrollable Content - Only shown on mobile */}
      {isMobile && (
        <div className="md:hidden">
          {/* Mobile Home Section */}
          <section className="py-16 bg-[#F6F8ED]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-[#002E1F] mb-6">Smart Irrigation Solutions</h2>
              <p className="text-lg text-gray-700 mb-8">Revolutionizing agriculture with sustainable technology</p>
              <Link href="/signup" className="inline-block bg-[#7AD63D] text-white px-6 py-3 rounded-md font-medium hover:bg-[#69c52c] transition-colors">
                GET STARTED
              </Link>
            </div>
          </section>
          
          {/* Mobile About Section */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-[#002E1F] mb-6">About IriQ</h2>
              <p className="text-lg text-gray-700 mb-4">
                At IriQ, we revolutionize agriculture with sustainable practices and innovative technologies.
              </p>
              <p className="text-lg text-gray-700">
                Committed to environmental stewardship and community empowerment, we aim to lead farming towards a sustainable and prosperous future.
              </p>
            </div>
          </section>
          
          {/* Mobile Services Section */}
          <section className="py-16 bg-[#F6F8ED]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-[#002E1F] mb-6 text-center">Our Services</h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-12 w-12 bg-[#7AD63D]/20 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#002E1F] mb-2">Smart Irrigation</h3>
                  <p className="text-gray-700">Automated systems that optimize water usage based on real-time soil conditions</p>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-12 w-12 bg-[#7AD63D]/20 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#7AD63D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#002E1F] mb-2">Data Analytics</h3>
                  <p className="text-gray-700">Comprehensive insights from soil moisture data to optimize agricultural practices</p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Mobile Footer */}
          <footer className="bg-[#002E1F] text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <div className="flex items-center">
                    <Image 
                      src="/iriqlogo-removebg-preview.png" 
                      alt="IriQ Logo" 
                      width={40} 
                      height={40} 
                      className="mr-2" 
                    />
                    <span className="text-2xl font-bold">IriQ</span>
                  </div>
                  <p className="text-sm mt-1 text-center">Smart Irrigation Solutions</p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="#" className="hover:text-[#7AD63D]">About</Link>
                  <Link href="#" className="hover:text-[#7AD63D]">Services</Link>
                  <Link href="#" className="hover:text-[#7AD63D]">Benefits</Link>
                  <Link href="#" className="hover:text-[#7AD63D]">Contact</Link>
                </div>
              </div>
              <div className="mt-8 border-t border-white/10 pt-8 text-sm text-center">
                <p>&copy; {new Date().getFullYear()} IriQ. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      )}
    </main>
  )
}
