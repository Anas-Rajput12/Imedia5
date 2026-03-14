export async function generateVoice(text: string) {

  const res = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID",
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2"
      })
    }
  )

  const blob = await res.blob()

  return URL.createObjectURL(blob)
}
