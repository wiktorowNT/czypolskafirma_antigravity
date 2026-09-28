import { createClient } from "@supabase/supabase-js"
import { POKAZ_NIEOPUBLIKOWANE } from "@/lib/publikacja"



export async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const client = createClient(supabaseUrl, supabaseKey)
  if (POKAZ_NIEOPUBLIKOWANE) return client

  // Produkcja: każdy odczyt z tabeli companies dostaje filtr published = true, więc firmy
  // czekające na publikację (lib/publikacja.ts) nie pokażą się w żadnym miejscu strony.
  const from = client.from.bind(client)
  ;(client as any).from = (tabela: string) => {
    const zapytanie: any = from(tabela)
    if (tabela !== "companies") return zapytanie
    const select = zapytanie.select.bind(zapytanie)
    zapytanie.select = (...argumenty: any[]) => select(...argumenty).eq("published", true)
    return zapytanie
  }
  return client
}
