import { serve } from "std/http/server.ts"
import { Redis } from "upstash_redis"

const redis = new Redis({
  url: Deno.env.get("REDIS_URL")!,
  token: Deno.env.get("REDIS_TOKEN")!,
})

serve(async (req) => {
  // Manejo de CORS manual para Edge Functions
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    })
  }

  try {
    const { email } = await req.json()
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    await redis.set(`otp:${email}`, otp, { ex: 300 })

    return new Response(
      JSON.stringify({ message: "OTP generado", email, otp }), // Enviamos el otp solo para que pruebes que funciona
      { 
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }, 
        status: 200 
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }, status: 400 }
    )
  }
})