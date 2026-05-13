const { useState, useRef, useEffect, useMemo, Fragment } = React;

interface Company {
  id: string
  brand: string
  company: string
  category: string
  categorySlug: string
  website_url?: string
  country_code?: string
}

interface SelectedCompany extends Company {
  customImage?: string
}

type ThemeMode = 'classic' | 'dark' | 'minimalist' | 'pro'
type LayoutMode = 'products' | 'shops'

function GeneratorPage() {
  const [selectedCompanies, setSelectedCompanies] = useState<SelectedCompany[]>([])
  const [title, setTitle] = useState("SPOŻYWCZE W POLSCE")
  const [subtitle, setSubtitle] = useState("DYSKONTY")
  const [description, setDescription] = useState("Sprawdzamy kto stoi za popularnymi markami")
  const [theme, setTheme] = useState<ThemeMode>('pro')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('shops')
  const printRef = useRef<HTMLDivElement>(null)

  // Custom Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Company[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      setIsDropdownOpen(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetchSupabase(searchQuery)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
          setIsDropdownOpen(data.length > 0)
        } else {
          setSuggestions([])
          setIsDropdownOpen(false)
        }
      } catch (err) {
        setSuggestions([])
        setIsDropdownOpen(false)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  const handleSelectCompany = (company: Company) => {
    if (selectedCompanies.length >= 6) {
      alert("Możesz dodać maksymalnie 6 firm do jednej grafiki.")
      return
    }
    if (selectedCompanies.find((c) => c.id === company.id)) {
      alert("Ta firma jest już dodana do zestawienia.")
      return
    }
    setSelectedCompanies([...selectedCompanies, { ...company }])
  }

  const handleRemoveCompany = (id: string) => {
    setSelectedCompanies(selectedCompanies.filter((c) => c.id !== id))
  }

  const handleImageUpload = (id: string, file: File) => {
    const imageUrl = URL.createObjectURL(file)
    setSelectedCompanies(
      selectedCompanies.map((c) => (c.id === id ? { ...c, customImage: imageUrl } : c))
    )
  }

  const handleDownloadImage = async () => {
    if (printRef.current === null) return

    // Ukrywamy elementy, których nie chcemy na grafice (np. przyciski X)
    const elementsToHide = document.querySelectorAll('.exclude-from-export');
    elementsToHide.forEach((el: any) => el.style.opacity = '0');

    try {
      const htmlToImage = window.htmlToImage
      const dataUrl = await htmlToImage.toPng(printRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Wyższa jakość dla social media
        skipAutoScale: true,
        backgroundColor: theme === 'dark' && !(layoutMode === 'shops' && selectedCompanies.length === 2) ? '#020617' : (theme === 'pro' ? '#f8fafc' : '#ffffff'),
      })
      
      const link = document.createElement('a')
      link.download = `czypolskafirma-${layoutMode}-${theme}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Błąd podczas generowania grafiki:', err)
      alert("Wystąpił błąd podczas generowania pliku. Spróbuj ponownie.");
    } finally {
      // Przywracamy widoczność elementów
      elementsToHide.forEach((el: any) => el.style.opacity = '');
    }
  }

  const getCountryName = (code?: string) => {
    if (!code) return "Brak danych"
    const normalizedCode = code.toUpperCase()
    return countryNames[normalizedCode] || normalizedCode
  }

  const getGridCols = () => {
    const count = selectedCompanies.length
    if (count <= 2) return "grid-cols-2"
    if (count <= 4) return "grid-cols-2"
    return "grid-cols-3"
  }

  const getCanvasStyles = () => {
    if (layoutMode === 'shops' && selectedCompanies.length === 2) return "bg-white shadow-2xl flex flex-col relative shrink-0"
    switch (theme) {
      case 'dark': return "bg-slate-950 shadow-2xl flex flex-col relative shrink-0"
      case 'minimalist': return "bg-white shadow-2xl flex flex-col relative shrink-0"
      case 'pro': return "bg-slate-50 shadow-2xl flex flex-col relative shrink-0 pb-6"
      case 'classic': default: return "bg-white shadow-2xl flex flex-col relative shrink-0"
    }
  }

  const getHeaderStyles = () => {
    switch (theme) {
      case 'dark': return "bg-slate-900 text-white p-8 text-center border-b-2 border-slate-800"
      case 'minimalist': return "bg-transparent text-slate-900 p-12 text-center"
      case 'classic': default: return "bg-[#0f172a] text-white p-8 text-center border-b-[6px] border-[#dc143c]"
    }
  }

  const getTitleStyles = () => {
    switch (theme) {
      case 'dark': return "text-4xl font-extrabold tracking-tight text-white"
      case 'minimalist': return "text-5xl font-black tracking-tight text-slate-900"
      case 'classic': default: return "text-4xl font-bold uppercase tracking-wide"
    }
  }

  const getSubtitleStyles = () => {
    switch (theme) {
      case 'dark': return "text-xl mt-3 text-slate-400 font-medium"
      case 'minimalist': return "text-2xl mt-4 text-slate-500 font-medium"
      case 'classic': default: return "text-xl mt-2 text-slate-300"
    }
  }

  const polandSvgPath = "M3945 9050 c-27 -5 -120 -25 -205 -46 -105 -25 -192 -39 -270 -44 -152 -10 -343 -71 -458 -146 -66 -45 -190 -101 -250 -115 -26 -6 -90 -14 -142 -18 -69 -5 -109 -14 -144 -30 -66 -32 -153 -116 -201 -194 -34 -55 -52 -72 -119 -113 -102 -63 -156 -82 -234 -83 -34 -1 -88 -10 -120 -20 -31 -10 -111 -29 -177 -41 -66 -11 -133 -26 -150 -31 -16 -6 -91 -21 -166 -34 -159 -27 -166 -28 -239 -59 -91 -38 -148 -57 -300 -97 -80 -21 -191 -56 -248 -78 -57 -23 -108 -41 -114 -41 -6 0 -32 -16 -59 -35 l-48 -34 -78 9 c-72 8 -80 7 -100 -12 -27 -25 -30 -60 -8 -78 9 -7 38 -24 66 -36 42 -20 51 -21 55 -9 4 9 19 15 38 15 17 0 42 9 56 20 33 26 146 29 136 4 -9 -23 11 -54 35 -54 29 0 22 -44 -7 -48 -12 -2 -30 -12 -39 -22 -15 -17 -16 -28 -9 -72 7 -43 13 -54 31 -56 28 -4 37 -30 18 -52 -8 -9 -15 -23 -15 -31 -1 -8 -8 0 -17 16 -31 59 -74 95 -114 95 -54 0 -85 14 -105 49 -25 43 -44 47 -70 14 -35 -43 -33 -107 5 -141 29 -24 30 -28 24 -86 -5 -54 -2 -66 19 -97 21 -32 54 -136 74 -239 4 -19 15 -46 25 -59 25 -32 25 -35 -18 -87 -37 -43 -37 -46 -34 -118 3 -83 -10 -114 -57 -135 -15 -7 -62 -35 -105 -63 l-78 -51 7 -43 c5 -34 2 -50 -15 -78 -12 -19 -18 -37 -14 -39 4 -3 31 -8 60 -12 44 -6 58 -13 88 -46 19 -21 39 -39 44 -39 5 0 41 -31 79 -68 49 -48 83 -72 113 -81 55 -17 120 -61 138 -95 13 -24 12 -28 -9 -51 -21 -23 -22 -26 -8 -38 36 -28 31 -53 -17 -92 -54 -45 -56 -64 -21 -174 26 -82 39 -96 97 -106 41 -7 44 -17 18 -65 -5 -9 -2 -22 8 -33 13 -13 14 -20 5 -29 -7 -7 -12 -27 -12 -45 0 -28 5 -36 35 -50 25 -12 34 -22 29 -32 -3 -9 -10 -41 -16 -71 -26 -149 -30 -160 -44 -160 -13 0 -104 -83 -104 -95 0 -2 13 -19 29 -37 16 -18 34 -51 40 -73 8 -29 24 -49 56 -72 37 -28 45 -39 51 -79 6 -42 4 -48 -26 -79 -18 -18 -30 -39 -28 -45 2 -7 60 -38 128 -69 107 -49 125 -60 128 -81 5 -49 35 -132 48 -137 8 -3 14 -15 14 -27 1 -11 7 -37 14 -57 12 -35 10 -44 -61 -224 -40 -103 -73 -193 -73 -200 0 -7 -18 -27 -39 -44 -34 -27 -38 -35 -32 -59 7 -25 12 -27 64 -30 71 -4 97 9 97 48 0 15 8 42 17 59 17 29 17 31 -2 45 -20 15 -20 15 3 38 12 12 22 17 22 10 0 -8 10 -9 30 -5 22 4 36 0 51 -13 17 -15 23 -16 41 -5 15 9 23 10 31 2 6 -6 22 -11 34 -11 13 0 37 -10 53 -22 28 -21 29 -22 14 -56 -13 -32 -12 -38 4 -66 11 -19 29 -33 45 -36 18 -3 35 -18 51 -45 20 -33 30 -40 58 -41 79 -4 208 -32 242 -54 30 -18 47 -22 92 -18 l54 5 31 -54 c33 -58 34 -58 67 -39 13 7 37 10 53 8 29 -4 32 -8 55 -71 3 -11 11 -8 32 11 15 14 39 33 54 43 25 15 29 15 50 1 32 -23 65 -20 83 8 15 23 18 23 64 11 56 -14 140 -72 141 -96 0 -9 -8 -27 -17 -40 -10 -13 -23 -33 -29 -44 -6 -12 -24 -21 -41 -23 -20 -2 -50 -21 -84 -52 l-54 -48 40 -41 c30 -32 46 -41 73 -41 28 0 35 -5 43 -30 8 -23 19 -31 46 -36 25 -5 40 -15 52 -37 9 -16 30 -43 48 -59 23 -22 35 -45 43 -82 9 -43 18 -58 52 -84 49 -38 113 -45 123 -14 3 11 15 24 28 29 12 6 41 26 64 45 24 20 68 43 102 54 34 10 61 22 61 26 0 5 9 4 19 -1 17 -10 19 -6 23 34 3 44 2 45 -30 51 -28 6 -34 12 -44 52 -6 24 -24 59 -39 77 -28 31 -28 33 -10 49 17 15 22 14 82 -13 45 -20 74 -27 97 -24 44 7 122 -23 122 -46 0 -22 100 -56 137 -46 24 6 25 4 19 -28 -4 -22 -2 -38 6 -44 7 -6 78 -11 162 -12 127 -2 151 1 167 15 11 9 19 23 19 31 0 17 15 17 45 -3 21 -13 22 -19 13 -40 -9 -19 -8 -28 5 -42 10 -10 17 -23 17 -28 -1 -16 -74 -56 -113 -62 -21 -2 -40 -9 -43 -14 -9 -13 45 -67 82 -82 19 -9 45 -36 70 -74 31 -50 49 -66 88 -83 l48 -21 45 24 c24 13 55 37 68 55 23 29 27 31 56 20 17 -7 38 -25 47 -42 23 -46 42 -56 69 -38 25 17 53 11 53 -11 0 -8 12 -19 28 -25 15 -6 42 -20 61 -32 21 -12 43 -18 56 -15 13 3 49 -3 80 -14 32 -11 72 -20 90 -20 27 0 33 -5 42 -34 6 -21 7 -38 2 -43 -6 -6 2 -40 18 -86 l27 -77 78 -30 c42 -16 86 -30 97 -30 16 0 21 -11 30 -63 6 -35 11 -75 11 -90 0 -14 5 -37 11 -50 10 -21 15 -23 65 -19 l54 4 0 -31 c0 -17 5 -51 12 -76 14 -50 36 -63 85 -50 16 4 46 9 68 10 56 2 114 57 122 114 5 39 7 40 52 46 85 11 91 14 91 40 0 28 26 45 69 45 25 0 37 -8 61 -42 16 -22 30 -47 30 -55 0 -8 10 -37 21 -64 19 -43 25 -49 50 -49 22 0 32 -6 39 -25 10 -26 15 -28 94 -29 57 -1 63 -11 65 -102 1 -27 7 -56 14 -63 8 -9 9 -15 1 -18 -6 -2 -25 -14 -42 -27 l-32 -23 25 -23 c20 -18 32 -22 64 -17 22 3 53 15 68 27 31 24 67 20 96 -11 11 -11 30 -24 44 -30 52 -20 58 -14 86 81 33 109 57 130 149 130 l57 0 7 35 c6 34 8 36 43 34 20 -2 49 5 66 13 28 15 32 15 87 -13 32 -16 62 -29 68 -29 6 0 13 13 16 29 6 28 9 29 53 28 25 -1 54 2 64 7 14 7 20 2 30 -23 6 -17 16 -31 22 -31 6 0 24 -13 39 -29 19 -20 34 -27 51 -23 17 3 25 0 25 -10 0 -8 11 -25 24 -37 37 -35 85 -23 120 30 15 22 38 45 51 51 19 9 25 19 25 44 0 27 5 35 25 40 19 5 30 0 48 -21 21 -25 25 -26 45 -14 12 8 22 21 22 30 0 33 63 38 150 13 66 -19 65 -19 160 -1 63 12 76 12 85 0 5 -7 33 -16 62 -19 48 -6 52 -9 69 -46 13 -29 20 -35 26 -25 4 8 21 20 37 27 28 11 34 10 80 -24 27 -20 55 -36 62 -36 21 0 79 -91 79 -123 0 -23 9 -31 73 -63 50 -26 83 -37 110 -35 27 1 37 -2 37 -13 0 -22 56 -48 97 -44 27 2 39 -3 53 -20 16 -19 31 -23 112 -28 54 -4 99 -12 108 -20 28 -24 92 -45 144 -48 42 -2 60 3 99 27 l47 29 -39 28 c-21 16 -42 33 -46 39 -3 6 -14 11 -24 11 -10 0 -28 11 -41 25 -18 20 -21 28 -12 37 7 7 12 24 12 38 0 15 9 35 20 45 21 19 40 73 40 113 0 15 -21 48 -56 85 -49 56 -55 66 -50 97 3 22 0 42 -9 54 -22 29 -18 72 7 96 12 11 25 20 29 20 4 0 21 24 37 53 17 28 108 136 204 240 95 103 196 217 225 254 76 97 163 183 298 292 66 54 126 106 134 115 8 10 32 26 52 37 30 15 40 27 45 53 8 46 57 66 158 66 83 0 177 15 186 30 3 6 19 64 35 130 l29 120 -22 45 c-12 25 -22 52 -22 60 0 8 -9 24 -20 35 -11 11 -20 31 -20 45 0 20 -5 25 -25 25 -27 0 -32 18 -15 51 9 15 22 19 69 19 49 0 61 4 81 26 16 16 21 28 14 32 -148 95 -172 115 -189 152 -10 22 -24 45 -32 51 -7 6 -13 22 -13 35 0 13 -12 35 -26 49 -15 15 -23 32 -20 40 3 8 8 21 11 28 3 7 -8 20 -25 30 -16 10 -30 27 -30 37 0 13 -13 23 -42 32 -32 10 -48 23 -60 48 -9 18 -31 46 -48 61 -35 32 -38 56 -11 90 29 38 36 97 14 121 -10 11 -18 27 -18 36 0 9 -19 29 -43 45 -37 25 -43 33 -37 54 4 16 -3 40 -20 72 -26 47 -26 49 -12 103 14 53 14 57 -6 76 -26 26 -14 44 51 72 44 20 45 21 37 58 -22 116 -10 188 35 212 18 10 19 13 6 38 -7 15 -17 46 -20 68 -7 38 -13 45 -71 79 -35 20 -71 48 -80 61 -9 14 -25 24 -39 24 -14 0 -57 13 -98 29 -40 16 -92 35 -116 42 -32 9 -41 16 -37 28 4 9 -3 22 -16 32 l-23 17 48 108 c43 96 56 116 115 172 113 107 179 139 391 192 l185 46 27 218 26 218 -30 50 c-27 43 -31 59 -29 112 1 47 -3 68 -19 91 -11 17 -20 37 -20 45 0 8 -22 29 -49 47 -37 24 -51 40 -56 65 -14 59 -46 149 -96 267 -46 106 -50 120 -44 171 5 46 1 70 -25 145 -17 50 -38 128 -46 174 -8 46 -21 93 -29 104 -8 12 -15 30 -15 41 0 11 -7 27 -16 37 -14 15 -14 20 -1 46 11 21 13 45 8 97 -6 57 -12 72 -31 85 -13 9 -44 37 -69 63 -35 35 -60 50 -102 62 -31 9 -59 22 -62 31 -4 8 -24 23 -47 35 -22 11 -40 24 -40 29 0 5 -26 8 -57 7 -53 -1 -58 1 -56 20 2 14 -6 25 -22 32 -14 7 -25 18 -25 27 0 8 -5 15 -11 15 -6 0 -41 15 -78 34 -75 38 -115 35 -109 -6 4 -31 -5 -32 -431 -68 -319 -28 -376 -30 -585 -24 -152 4 -260 3 -316 -5 -73 -9 -136 -7 -450 19 -201 16 -556 52 -790 80 -234 28 -451 53 -482 57 l-57 6 -14 -34 c-25 -59 -66 -88 -144 -103 -47 -9 -86 -24 -116 -45 -48 -33 -62 -37 -164 -45 -60 -5 -63 -5 -63 17 0 13 -5 28 -11 34 -16 16 33 39 107 53 122 21 147 28 156 44 12 21 61 46 92 46 14 0 31 9 41 23 26 37 -4 33 -103 -17 -101 -51 -214 -85 -317 -95 -84 -9 -396 -2 -410 9 -5 5 -36 11 -68 15 -39 5 -68 15 -87 31 -15 13 -39 24 -53 24 -43 0 -68 48 -71 133 -1 50 -7 82 -19 100 -9 14 -17 37 -17 50 0 18 -5 23 -22 23 -18 -1 -24 5 -26 29 -2 18 -18 43 -39 63 -20 21 -32 40 -29 49 3 8 6 21 6 29 0 11 9 10 48 -5 170 -67 252 -120 325 -210 22 -27 30 -31 42 -21 22 18 1 50 -80 118 -47 39 -85 62 -115 70 -25 6 -81 32 -125 57 -44 25 -89 45 -100 45 -11 0 -38 11 -60 25 -38 23 -48 24 -185 23 -80 0 -167 -4 -195 -8z";

  const renderGridTemplate = () => {
    if (theme === 'pro') {
      return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
          <div className="bg-[#f8fafc] text-left p-12 pb-4 flex justify-between items-end relative overflow-hidden">
            <div className="z-10 relative">
              <h2 className="text-[#0f172a] font-black uppercase text-5xl tracking-tight mb-2">{subtitle}</h2>
              <h1 className="text-[#dc143c] font-black uppercase text-6xl tracking-tight mb-6">{title}</h1>
              <div className="text-slate-600 text-xl font-medium flex items-center gap-2">
                {description}
                {description && <div className="h-0.5 w-16 bg-[#dc143c] ml-2"></div>}
              </div>
            </div>
            
            <div className="absolute right-0 top-0 bottom-0 w-[400px] flex items-center justify-end pr-10">
              <div className="absolute w-[320px] h-[320px] rounded-full opacity-40 right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 3px, transparent 3px)', backgroundSize: '24px 24px' }}></div>
              <svg viewBox="0 0 1024 1024" className="w-72 h-72 fill-white z-10 relative left-8 pointer-events-none" style={{ filter: "drop-shadow(-5px 15px 20px rgba(0,0,0,0.1)) drop-shadow(0px 0px 5px rgba(0,0,0,0.05))" }}>
                <g transform="translate(0,1024) scale(0.1,-0.1)">
                  <path d={polandSvgPath} />
                </g>
              </svg>
            </div>
          </div>

          <div className={`flex-1 grid ${getGridCols()} gap-8 px-12 pt-8 pb-4 relative z-20`}>
            {selectedCompanies.map((company) => {
              const isPolish = company.country_code?.toLowerCase() === 'pl'
              return (
                <div key={company.id} className={`group bg-white rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border-4 flex flex-col p-6 relative transition-all ${isPolish ? 'border-[#00c853] shadow-[0_20px_50px_-15px_rgba(0,200,83,0.2)] ring-8 ring-green-50' : 'border-slate-100 shadow-sm'}`}>
                  
                  {isPolish && (
                    <div className="absolute -top-4 -right-4 bg-[#00c853] text-white px-5 py-2 rounded-full font-black uppercase tracking-widest text-[11px] shadow-lg z-30 border-2 border-white">
                      Polska Firma
                    </div>
                  )}

                  <button 
                    onClick={() => handleRemoveCompany(company.id)}
                    className="exclude-from-export absolute top-4 left-4 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-30 hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                    title="Usuń firmę"
                  >
                    <i data-lucide="x" className="h-4 w-4" />
                  </button>

                  <div className="flex-1 flex flex-col">
                    <div className={`h-32 mb-6 flex items-center justify-center relative rounded-3xl transition-all ${isPolish ? 'bg-white' : 'bg-slate-50/50'}`}>
                       {layoutMode === 'products' && company.customImage ? (
                          <img src={company.customImage} alt={company.brand} className="max-h-full max-w-full object-contain filter drop-shadow-lg" />
                       ) : (
                          <CompanyLogo websiteUrl={company.website_url} name={company.brand} size={100} className="shadow-none border-0 bg-transparent" />
                       )}
                    </div>
                    
                    <h2 className="text-3xl font-black text-slate-900 truncate mb-1">{company.brand}</h2>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Właściciel:</div>
                    <div className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider truncate mb-4">{company.company}</div>
                    
                    <div className={`mt-auto rounded-2xl p-3 px-4 flex items-center justify-between border transition-all ${isPolish ? 'bg-green-50/50 border-green-100' : 'bg-slate-50/50 border-slate-100/50'}`}>
                       <div className="flex items-center gap-3">
                        {isPolish ? (
                           <svg viewBox="0 0 1024 1024" className="w-5 h-5 fill-green-500 opacity-80"><g transform="translate(0,1024) scale(0.1,-0.1)"><path d={polandSvgPath}/></g></svg>
                        ) : (
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-500 opacity-80">
                             <circle cx="12" cy="12" r="10"></circle>
                             <line x1="2" y1="12" x2="22" y2="12"></line>
                             <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                           </svg>
                        )}
                        <div>
                          <div className={`text-[9px] uppercase font-black tracking-widest ${isPolish ? 'text-green-600' : 'text-red-500'}`}>KAPITAŁ</div>
                          <div className="text-base font-black text-slate-900 leading-tight">{getCountryName(company.country_code)}</div>
                        </div>
                      </div>
                      {company.country_code && <img src={`https://flagcdn.com/w80/${company.country_code.toLowerCase()}.png`} className="h-6 rounded shadow-sm border border-slate-200" alt={company.country_code} />}
                    </div>
                  </div>
                </div>
              )
            })}
            {selectedCompanies.length === 0 && (
              <div className="col-span-full h-64 flex items-center justify-center text-slate-400 font-bold text-2xl border-4 border-dashed border-slate-200/50 rounded-3xl">
                Wyszukaj i dodaj firmę, aby rozpocząć...
              </div>
            )}
          </div>

          <div className="mx-12 mb-10 bg-white rounded-3xl p-5 px-8 flex justify-between items-center shadow-sm border border-slate-100 relative z-20">
            <div className="flex items-center gap-4">
              <img src="https://flagcdn.com/w80/pl.png" className="h-8 rounded shadow-sm" alt="PL" />
              <span className="text-2xl font-black text-slate-900">CzyPolskaFirma.pl</span>
              <div className="w-px h-6 bg-slate-200 mx-2"></div>
              <span className="text-slate-500 font-medium text-sm">Wspieraj polskie firmy</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
              <i data-lucide="heart" className="w-5 h-5 text-red-500" />
              Wspieraj lokalnie, kupuj świadomie.
            </div>
          </div>
        </div>
      )
    }

    return (
      <>
        <div className={getHeaderStyles()}>
          <h1 className={getTitleStyles()}>{title}</h1>
          {subtitle && <p className={getSubtitleStyles()}>{subtitle}</p>}
        </div>

        <div className={`flex-1 grid ${getGridCols()} ${theme === 'dark' ? 'gap-8 p-10 bg-slate-950' : theme === 'minimalist' ? 'gap-12 px-12 pb-12 bg-white' : 'gap-8 p-10 bg-slate-100'}`}>
          {selectedCompanies.map((company) => {
            const isPolish = company.country_code?.toLowerCase() === 'pl'
            return (
              <div key={company.id} className={
                theme === 'dark' 
                  ? `group bg-slate-900 rounded-3xl shadow-xl border flex flex-col overflow-hidden relative ${isPolish ? 'border-green-500/50 shadow-green-900/20' : 'border-slate-800'}`
                  : theme === 'minimalist'
                    ? `group bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border-0 flex flex-col overflow-hidden relative ${isPolish ? 'ring-2 ring-[#dc143c]/10 ring-offset-4' : 'ring-1 ring-slate-100'}`
                    : `group bg-white rounded-2xl shadow-md border flex flex-col overflow-hidden relative ${isPolish ? 'border-slate-200 border-t-4 border-t-[#dc143c]' : 'border-slate-200'}`
              }>
                
                {isPolish && theme === 'classic' && <div className="absolute top-4 right-4 bg-[#dc143c] text-white px-4 py-1 rounded-full font-bold shadow text-sm uppercase tracking-wide z-10">Polska Firma</div>}
                {isPolish && theme === 'minimalist' && <div className="absolute top-6 right-6 bg-red-50 text-red-600 px-4 py-1.5 rounded-full font-bold shadow-sm text-sm uppercase tracking-wide z-10">Polska Firma</div>}
                {isPolish && theme === 'dark' && <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-1 rounded-full font-bold shadow text-sm uppercase tracking-wide z-10">Polska Firma</div>}
                
                <button 
                  onClick={() => handleRemoveCompany(company.id)}
                  className="exclude-from-export absolute top-4 left-4 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-30 hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  title="Usuń firmę"
                >
                  <i data-lucide="x" className="h-4 w-4" />
                </button>

                <div className={theme === 'dark' ? "h-64 bg-slate-900/50 flex items-center justify-center p-6 border-b border-slate-800 relative overflow-hidden" : theme === 'minimalist' ? "h-64 bg-transparent flex items-center justify-center p-8 relative overflow-hidden" : "h-56 bg-white flex items-center justify-center p-4 border-b border-slate-100 relative overflow-hidden"}>
                  {layoutMode === 'products' ? (
                    company.customImage ? (
                      <img src={company.customImage} alt={company.brand} className="max-h-full max-w-full object-contain filter drop-shadow-xl" />
                    ) : (
                      <div className={`font-bold text-xl text-center px-4 flex flex-col items-center gap-2 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`}>
                        <i data-lucide="layout-template" className="h-10 w-10 opacity-50" />
                        Wgraj zdjęcie
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <CompanyLogo websiteUrl={company.website_url} name={company.brand} size={140} className={`rounded-3xl shadow-lg border-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-800' : 'border-slate-100 bg-white'}`} />
                    </div>
                  )}
                </div>
                
                <div className={theme === 'dark' ? "p-6 flex-1 flex flex-col bg-slate-900" : theme === 'minimalist' ? "px-8 pb-8 pt-2 flex-1 flex flex-col bg-white" : "p-6 flex-1 flex flex-col"}>
                  {layoutMode === 'products' && (
                    <div className="flex items-center gap-3 mb-2">
                      <CompanyLogo websiteUrl={company.website_url} name={company.brand} size={theme === 'minimalist' ? 48 : 40} className="flex-shrink-0 shadow-sm" />
                      <h2 className={theme === 'dark' ? "text-3xl font-bold text-white truncate" : theme === 'minimalist' ? "text-3xl font-extrabold text-slate-900 truncate" : "text-3xl font-bold text-slate-900 truncate"}>{company.brand}</h2>
                    </div>
                  )}
                  {layoutMode === 'shops' && (
                     <h2 className={`mb-2 ${theme === 'dark' ? "text-3xl font-bold text-white truncate" : theme === 'minimalist' ? "text-3xl font-extrabold text-slate-900 truncate" : "text-3xl font-bold text-slate-900 truncate"}`}>{company.brand}</h2>
                  )}

                  <p className={theme === 'dark' ? "text-lg text-slate-400 mb-6 truncate" : theme === 'minimalist' ? "text-lg font-medium text-slate-500 mb-6 truncate" : "text-lg text-slate-500 mb-6 truncate"}>Właściciel: {company.company}</p>
                  
                  <div className={`mt-auto rounded-xl p-4 flex items-center justify-between ${theme === 'dark' ? (isPolish ? 'bg-green-950/30 border-l-4 border-green-500' : 'bg-slate-800/50 border-l-4 border-slate-700') : theme === 'minimalist' ? (isPolish ? 'bg-red-50 border-0' : 'bg-slate-50 border-0') : (isPolish ? 'bg-green-50 border-l-8 border-green-500' : 'bg-slate-50 border-l-8 border-slate-300')}`}>
                    <div>
                      <div className={`text-sm uppercase font-bold tracking-wider ${theme === 'dark' ? (isPolish ? 'text-green-500' : 'text-slate-500') : theme === 'minimalist' ? (isPolish ? 'text-red-500' : 'text-slate-400') : (isPolish ? 'text-green-700' : 'text-slate-500')}`}>Kapitał</div>
                      <div className={`text-2xl font-bold truncate max-w-[150px] ${theme === 'dark' ? 'text-white' : (isPolish ? (theme === 'minimalist' ? 'text-slate-900' : 'text-green-900') : 'text-slate-900')}`}>{getCountryName(company.country_code)}</div>
                    </div>
                    {company.country_code && <img src={`https://flagcdn.com/w80/${company.country_code.toLowerCase()}.png`} className={`h-12 w-auto object-cover rounded shadow-sm flex-shrink-0 ${theme === 'dark' ? 'opacity-90' : 'border border-slate-200'}`} alt={company.country_code} />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className={theme === 'dark' ? "bg-slate-900 border-t border-slate-800 p-8 flex justify-between items-center mt-auto" : theme === 'minimalist' ? "bg-slate-50 rounded-t-3xl mx-6 p-8 flex justify-between items-center mt-auto" : "bg-white border-t-2 border-slate-200 p-6 px-10 flex justify-between items-center mt-auto"}>
          <div className="flex items-center gap-4">
            <img src="https://flagcdn.com/w80/pl.png" className="h-10 rounded shadow-sm" alt="PL" />
            <span className={`text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>CzyPolskaFirma.pl</span>
          </div>
          <div className={`text-xl font-medium tracking-widest uppercase ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Wspieraj polskie firmy</div>
        </div>
      </>
    )
  }

  const renderVersusSplitTemplate = () => {
    const leftCompany = selectedCompanies[0]
    const rightCompany = selectedCompanies[1]

    return (
      <>
        <div className="bg-[#0f172a] text-white p-12 text-center relative border-b-[8px] border-[#dc143c]">
          <div className="text-[#dc143c] font-black tracking-widest uppercase text-2xl mb-2">{subtitle || 'Pojedynek'}</div>
          <h1 className="text-6xl font-black uppercase tracking-tight">{title || 'Gdzie robisz codzienne zakupy?'}</h1>
        </div>

        <div className="flex-1 flex bg-slate-50 relative">
          
          <div className="group flex-1 flex flex-col items-center justify-center p-12 relative border-r-2 border-slate-200 border-dashed">
            {leftCompany ? (
              <>
                <button 
                  onClick={() => handleRemoveCompany(leftCompany.id)}
                  className="exclude-from-export absolute top-8 left-8 bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30 hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  title="Usuń firmę"
                >
                  <i data-lucide="x" className="h-6 w-6" />
                </button>
                <div className="w-[280px] h-[280px] flex items-center justify-center rounded-[40px] bg-white shadow-xl border-4 border-slate-200 mb-10 overflow-hidden p-8">
                  <CompanyLogo websiteUrl={leftCompany.website_url} name={leftCompany.brand} size={200} className="rounded-none border-0 shadow-none" />
                </div>
                <h2 className="text-5xl font-black text-slate-900 mb-4">{leftCompany.brand}</h2>
                <div className="text-2xl text-slate-500 font-bold mb-12">{leftCompany.company}</div>
                
                <div className={`bg-white rounded-3xl w-full p-8 shadow-lg border-t-8 text-center flex items-center justify-between ${leftCompany.country_code?.toLowerCase() === 'pl' ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="text-left">
                    <div className={`font-black uppercase tracking-widest text-lg mb-1 ${leftCompany.country_code?.toLowerCase() === 'pl' ? 'text-green-600' : 'text-red-500'}`}>Kapitał</div>
                    <div className={`text-4xl font-black ${leftCompany.country_code?.toLowerCase() === 'pl' ? 'text-green-900' : 'text-slate-900'}`}>{getCountryName(leftCompany.country_code)}</div>
                  </div>
                  {leftCompany.country_code && <img src={`https://flagcdn.com/w160/${leftCompany.country_code.toLowerCase()}.png`} className="h-20 rounded-lg shadow-sm border border-slate-200" alt={leftCompany.country_code} />}
                </div>
              </>
            ) : (
              <div className="text-slate-300 font-bold text-2xl">Wybierz firmę #1</div>
            )}
          </div>

          <div className="group flex-1 flex flex-col items-center justify-center p-12 relative bg-green-50/30">
            {rightCompany ? (
              <>
                <button 
                  onClick={() => handleRemoveCompany(rightCompany.id)}
                  className="exclude-from-export absolute top-8 right-8 bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30 hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  title="Usuń firmę"
                >
                  <i data-lucide="x" className="h-6 w-6" />
                </button>
                {rightCompany.country_code?.toLowerCase() === 'pl' && (
                   <div className="absolute top-12 right-12 bg-green-500 text-white px-8 py-2 rounded-full font-black uppercase tracking-widest text-lg shadow-lg z-10">Polska Firma</div>
                )}
                <div className={`w-[280px] h-[280px] flex items-center justify-center rounded-[40px] bg-white shadow-xl border-4 mb-10 overflow-hidden p-8 relative ${rightCompany.country_code?.toLowerCase() === 'pl' ? 'border-green-400 ring-8 ring-green-100' : 'border-slate-200'}`}>
                  <CompanyLogo websiteUrl={rightCompany.website_url} name={rightCompany.brand} size={200} className="rounded-none border-0 shadow-none" />
                </div>
                <h2 className="text-5xl font-black text-slate-900 mb-4">{rightCompany.brand}</h2>
                <div className="text-2xl text-slate-500 font-bold mb-12">{rightCompany.company}</div>
                
                <div className={`bg-white rounded-3xl w-full p-8 shadow-xl border-t-8 text-center flex items-center justify-between ${rightCompany.country_code?.toLowerCase() === 'pl' ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="text-left">
                    <div className={`font-black uppercase tracking-widest text-lg mb-1 ${rightCompany.country_code?.toLowerCase() === 'pl' ? 'text-green-600' : 'text-red-500'}`}>Kapitał</div>
                    <div className={`text-4xl font-black ${rightCompany.country_code?.toLowerCase() === 'pl' ? 'text-green-900' : 'text-slate-900'}`}>{getCountryName(rightCompany.country_code)}</div>
                  </div>
                  {rightCompany.country_code && <img src={`https://flagcdn.com/w160/${rightCompany.country_code.toLowerCase()}.png`} className="h-20 rounded-lg shadow-sm border border-slate-200" alt={rightCompany.country_code} />}
                </div>
              </>
            ) : (
              <div className="text-slate-300 font-bold text-2xl">Wybierz firmę #2</div>
            )}
          </div>

          {leftCompany && rightCompany && (
            <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full border-4 border-slate-200 flex items-center justify-center text-slate-400 text-3xl font-black shadow-lg z-20">
              VS
            </div>
          )}
        </div>

        <div className="bg-white p-8 border-t-2 border-slate-100 flex justify-between items-center px-16 mt-auto">
          <div className="flex items-center gap-4">
            <img src="https://flagcdn.com/w80/pl.png" className="h-10 rounded shadow-sm border border-slate-200" alt="PL" />
            <span className="text-3xl font-black text-slate-900">CzyPolskaFirma.pl</span>
          </div>
          <div className="text-slate-400 font-bold tracking-widest uppercase text-xl">Wybieraj mądrze</div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Generator Grafik Social Media</h1>
          <p className="text-slate-500 mb-6">Wyszukaj firmy w bazie i wygeneruj gotowego PNG na Twittera.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            
            <div className="md:col-span-1 border-r border-slate-200 pr-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Wybierz Rodzaj Grafiki</label>
              <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                <button 
                  onClick={() => setLayoutMode('products')}
                  className={`flex-1 text-sm py-2 px-3 rounded-md font-bold transition-all ${layoutMode === 'products' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Produkty (Ze Zdjęciem)
                </button>
                <button 
                  onClick={() => setLayoutMode('shops')}
                  className={`flex-1 text-sm py-2 px-3 rounded-md font-bold transition-all ${layoutMode === 'shops' ? 'bg-[#dc143c] shadow text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Sklepy (Duże Logo)
                </button>
              </div>

              {!(layoutMode === 'shops' && selectedCompanies.length === 2) && (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-2 mt-4">Wybierz Motyw Kolorystyczny</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setTheme('pro')}
                      className={`text-xs py-2 px-2 rounded-md font-bold transition-all ${theme === 'pro' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Pro (ChatGPT)
                    </button>
                    <button 
                      onClick={() => setTheme('classic')}
                      className={`text-xs py-2 px-2 rounded-md font-medium transition-all ${theme === 'classic' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Klasyczny
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`text-xs py-2 px-2 rounded-md font-medium transition-all ${theme === 'dark' ? 'bg-slate-900 shadow text-white border border-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Dark
                    </button>
                    <button 
                      onClick={() => setTheme('minimalist')}
                      className={`text-xs py-2 px-2 rounded-md font-medium transition-all ${theme === 'minimalist' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Minimal
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tytuł grafiki (Duży Czerwony)</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Podtytuł grafiki (Duży Czarny)</label>
                <input 
                  type="text" 
                  value={subtitle} 
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Opis pod tytułem (Trzecia linia)</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white"
                />
              </div>
              
              <div className="col-span-2 mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Wyszukaj firmę do dodania (Max 6)
                </label>
                <div className="max-w-full relative z-50">
                  <div className="relative">
                    <div className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400">
                      <i data-lucide="search" className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Wpisz nazwę, slug lub wklej link..."
                      className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#dc143c] focus:outline-none"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-[#dc143c]"></div>
                      </div>
                    )}
                    {!isSearching && searchQuery && (
                      <button onClick={() => { setSearchQuery(""); setIsDropdownOpen(false); setSuggestions([]) }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-500">
                        <i data-lucide="x" className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {isDropdownOpen && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                      {suggestions.map((company) => (
                        <div
                          key={company.id}
                          onClick={() => {
                            handleSelectCompany(company)
                            setSearchQuery("")
                            setIsDropdownOpen(false)
                          }}
                          className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                          <CompanyLogo websiteUrl={company.website_url} name={company.brand} size={36} className="shadow-sm border border-slate-100" />
                          <div>
                            <div className="font-bold text-slate-900">{company.brand}</div>
                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{company.company}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start">
            <div className="w-full xl:w-80 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-lg text-slate-800">
                  Dodane firmy ({selectedCompanies.length}/6)
                </h3>
                {selectedCompanies.length > 0 && (
                  <button 
                    onClick={() => setSelectedCompanies([])}
                    className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider"
                  >
                    Wyczyść wszystko
                  </button>
                )}
              </div>
              {selectedCompanies.map((company, index) => (
                <div key={company.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {layoutMode === 'shops' && selectedCompanies.length === 2 ? (
                        <div className="bg-slate-800 text-white font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs">
                           {index + 1}
                        </div>
                      ) : (
                        <CompanyLogo websiteUrl={company.website_url} name={company.brand} size={28} className="rounded" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900">{company.brand}</div>
                        <div className="text-xs text-slate-500">{company.country_code?.toUpperCase()}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveCompany(company.id)} 
                      className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-600 transition-all"
                      title="Usuń firmę"
                    >
                      <i data-lucide="x" className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {layoutMode === 'products' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Zdjęcie produktu</label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(company.id, e.target.files[0])
                            }
                          }}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <button onClick={handleDownloadImage} className="w-full mt-2 flex gap-2 h-14 bg-[#0f172a] hover:bg-[#1e293b] text-white text-lg font-bold">
                <i data-lucide="download" className="h-6 w-6" />
                Pobierz Grafikę (PNG)
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-300 p-4 md:p-8 rounded-xl flex justify-center items-center overflow-x-auto w-full">
              <div 
                ref={printRef} 
                style={{ width: '1080px', minHeight: '1080px' }} 
                className={getCanvasStyles()}
              >
                {layoutMode === 'shops' && selectedCompanies.length === 2 
                  ? renderVersusSplitTemplate() 
                  : renderGridTemplate()}
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}
