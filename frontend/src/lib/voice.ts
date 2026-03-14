// src/lib/voice.ts

export async function speak(
  text: string,
  setSpeaking?: (value: boolean) => void
) {

  try {

    // speaking state ON
    if (setSpeaking) setSpeaking(true)

    const response = await fetch("/api/voice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok)
      throw new Error("Voice API failed")

    const blob = await response.blob()

    const audioUrl = URL.createObjectURL(blob)

    const audio = new Audio(audioUrl)

    audio.onended = () => {
      if (setSpeaking) setSpeaking(false)
    }

    await audio.play()

    return audio

  } catch (error) {

    console.error("Speak error:", error)

    if (setSpeaking) setSpeaking(false)
  }
}