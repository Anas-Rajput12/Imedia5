'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useAudioAnalyzer() {
  const [audioLevel, setAudioLevel] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number>()
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const startAnalyzing = useCallback(async () => {
    try {
      // Request microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      
      mediaStreamRef.current = mediaStream
      
      // Create audio context
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      
      // Create analyser
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser
      
      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(mediaStream)
      source.connect(analyser)
      sourceRef.current = source
      
      // Create data array for frequency data
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      dataArrayRef.current = dataArray
      
      // Analyze audio levels
      const analyzeAudio = () => {
        if (!analyserRef.current || !dataArrayRef.current) return
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)
        
        // Calculate average volume
        let sum = 0
        const length = dataArrayRef.current.length
        for (let i = 0; i < length; i++) {
          sum += dataArrayRef.current[i]
        }
        const average = sum / length
        
        // Normalize to 0-1 range
        const normalizedLevel = Math.min(1, average / 50)
        setAudioLevel(normalizedLevel)
        
        animationFrameRef.current = requestAnimationFrame(analyzeAudio)
      }
      
      analyzeAudio()
      setIsAnalyzing(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setIsAnalyzing(false)
    }
  }, [])

  const stopAnalyzing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    analyserRef.current = null
    dataArrayRef.current = null
    setAudioLevel(0)
    setIsAnalyzing(false)
  }, [])

  useEffect(() => {
    return () => {
      stopAnalyzing()
    }
  }, [stopAnalyzing])

  return {
    audioLevel,
    isAnalyzing,
    startAnalyzing,
    stopAnalyzing,
  }
}
