'use client'

interface YearGroupSelectorProps {
  selectedYear: string
  onSelectYear: (year: string) => void
  availableYears?: string[]
}

export default function YearGroupSelector({
  selectedYear,
  onSelectYear,
  availableYears = ['5', '6', '7', '8', '9', '10', '11']
}: YearGroupSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Select Year Group
      </h3>

      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
        {availableYears.map((year) => (
          <button
            key={year}
            onClick={() => onSelectYear(year)}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              selectedYear === year
                ? 'bg-blue-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Year {year}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Currently studying: <span className="font-semibold text-blue-600">Year {selectedYear}</span>
      </p>
    </div>
  )
}
