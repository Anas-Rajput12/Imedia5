export async function speak(text: string, setSpeaking: any, setAudio: any) {

  const utterance = new SpeechSynthesisUtterance(text)

  utterance.onstart = () => setSpeaking(true)
  utterance.onend = () => setSpeaking(false)

  speechSynthesis.speak(utterance)

}