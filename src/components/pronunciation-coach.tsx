'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Check, AlertCircle, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useVocabStore } from '@/store/vocab-store'

export function PronunciationCoach() {
  const words = useVocabStore(state => state.words)
  const [targetWord, setTargetWord] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [speechSupported, setSpeechSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setSpeechSupported(true)
    }
  }, [])

  const getRandomWord = () => {
    if (words.length === 0) { toast.error('Add some words first!'); return }
    const randomWord = words[Math.floor(Math.random() * words.length)]
    setTargetWord(randomWord.word)
    setRecognizedText('')
    setAccuracy(null)
  }

  const startListening = () => {
    if (!speechSupported || !targetWord) return
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setRecognizedText(transcript);
      calculateAccuracy(transcript, targetWord.toLowerCase());
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Mic error. Try again.');
    };

    recognition.start();
  }

  const calculateAccuracy = (spoken: string, target: string) => {
    if (spoken === target) { setAccuracy(100); toast.success('Perfect Pronunciation! 🎉'); return }
    
    let matches = 0;
    const maxLen = Math.max(spoken.length, target.length);
    for (let i = 0; i < target.length; i++) {
      if (spoken.includes(target[i])) matches++;
    }
    const score = Math.round((matches / maxLen) * 100);
    setAccuracy(score);
    if (score > 80) toast.success('Good job! Very close!');
    else toast.error('Needs practice. Listen and try again.');
  }

  const speakWord = () => {
    if (!targetWord || !window.speechSynthesis) return
    const utterance = new SpeechSynthesisUtterance(targetWord)
    utterance.lang = 'en-US'; utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5 text-cyan-600" />Pronunciation Coach</CardTitle>
          <p className="text-sm text-gray-500">Practice your English pronunciation and get instant feedback</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={targetWord} onChange={(e) => { setTargetWord(e.target.value); setAccuracy(null); setRecognizedText('') }} placeholder="Type or get a random word..." dir="ltr" />
            <Button onClick={getRandomWord} variant="outline">Random Word</Button>
          </div>

          {targetWord && (
            <div className="text-center space-y-6 py-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <h2 className="text-4xl font-bold capitalize">{targetWord}</h2>
              
              <div className="flex justify-center gap-4">
                <Button onClick={speakWord} variant="outline" className="rounded-full w-16 h-16">
                  <Volume2 className="w-8 h-8 text-blue-500" />
                </Button>
                
                {!speechSupported ? (
                  <Button disabled className="rounded-full w-16 h-16"><MicOff className="w-8 h-8" /></Button>
                ) : (
                  <Button onClick={isListening ? () => {} : startListening} className={`rounded-full w-16 h-16 transition-colors ${isListening ? "bg-rose-500 hover:bg-rose-600 animate-pulse" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                    {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                  </Button>
                )}
              </div>

              {isListening && <p className="text-rose-500 font-medium animate-pulse">Listening... Speak now!</p>}

              {recognizedText && (
                <div className="space-y-2">
                  <p className="text-gray-500 text-sm">You said:</p>
                  <p className="text-2xl font-semibold capitalize">{recognizedText}</p>
                </div>
              )}

              {accuracy !== null && (
                <div className="space-y-2 max-w-xs mx-auto">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Accuracy</span>
                    <span className={accuracy === 100 ? "text-emerald-600" : accuracy > 70 ? "text-amber-600" : "text-rose-600"}>{accuracy}%</span>
                  </div>
                  <Progress value={accuracy} className={`h-3 ${accuracy === 100 ? "[&>div]:bg-emerald-500" : accuracy > 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-rose-500"}`} />
                  {accuracy === 100 && <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold"><Check className="w-5 h-5" /> Perfect!</div>}
                  {accuracy < 100 && accuracy > 0 && (
                    <div className="flex items-center justify-center gap-2 text-amber-600 text-sm">
                      <AlertCircle className="w-4 h-4" /> Try to match the exact sounds.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
