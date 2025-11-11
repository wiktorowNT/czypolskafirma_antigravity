export async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return {
    from: (table: string) => ({
      select: (fields: string) => ({
        eq: (field: string, value: any) => ({
          single: async () => {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${field}=eq.${value}&select=${fields}`, {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            })
            const data = await response.json()
            return { data: data[0] || null, error: response.ok ? null : data }
          },
        }),
        order: (orderBy: string, options: any) => ({
          then: async (callback: any) => {
            const response = await fetch(
              `${supabaseUrl}/rest/v1/${table}?select=${fields}&order=${orderBy}.${options.ascending ? "asc" : "desc"}`,
              {
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                },
              },
            )
            const data = await response.json()
            callback({ data, error: response.ok ? null : data })
          },
        }),
      }),
    }),
  }
}
