"use client"

import { useState, useRef, useEffect } from "react"
import { CompanyLogo } from "@/components/company-logo"

import { Download, X, LayoutTemplate, Globe, Heart, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { countryNames } from "@/lib/countries"





 setIsDropdownOpen(false); setSuggestions([]) }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-500">
                        <X className="h-5 w-5" />
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
              <h3 className="font-bold text-lg text-slate-800">
                Dodane firmy ({selectedCompanies.length}/6)
              </h3>
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
                    <button onClick={() => handleRemoveCompany(company.id)} className="text-slate-400 hover:text-red-500">
                      <X className="h-5 w-5" />
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
              
              <Button onClick={handleDownloadImage} className="w-full mt-2 flex gap-2 h-14 bg-[#0f172a] hover:bg-[#1e293b] text-white text-lg font-bold">
                <Download className="h-6 w-6" />
                Pobierz Grafikę (PNG)
              </Button>
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
