'use client'

import React, { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = []
    const particleCount = 50

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      life: number

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth
        this.y = Math.random() * canvasHeight
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = Math.random() * -0.5 - 0.5
        this.size = Math.random() * 3 + 1
        this.color = Math.random() > 0.5 ? 'rgba(251, 146, 60, 0.5)' : 'rgba(147, 51, 234, 0.3)'
        this.life = Math.random() * 100 + 100
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.life--

        if (this.life <= 0 || this.y < 0) {
          this.reset()
        }
      }

      reset() {
        if (!canvas) return
        this.x = Math.random() * canvas.width
        this.y = canvas.height + 10
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = Math.random() * -0.5 - 0.5
        this.life = Math.random() * 100 + 100
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height))
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}