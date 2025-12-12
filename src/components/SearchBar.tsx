import './SearchBar.css'

interface SearchBarProps {
  query: string
  onQueryChange: (value: string) => void
  videosOnly: boolean
  onVideosOnlyChange: (value: boolean) => void
  hasLocationOnly: boolean
  onHasLocationOnlyChange: (value: boolean) => void
  locationQuery: string
  onLocationQueryChange: (value: string) => void
}

export function SearchBar({
  query,
  onQueryChange,
  videosOnly,
  onVideosOnlyChange,
  hasLocationOnly,
  onHasLocationOnlyChange,
  locationQuery,
  onLocationQueryChange,
}: SearchBarProps) {
  return (
    <div className="searchbar">
      <input
        className="searchbar-input"
        type="search"
        placeholder="Search caption, hashtags, username, shortcode…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <label className="searchbar-toggle">
        <input
          type="checkbox"
          checked={videosOnly}
          onChange={(e) => onVideosOnlyChange(e.target.checked)}
        />
        <span>Videos only</span>
      </label>
      <label className="searchbar-toggle">
        <input
          type="checkbox"
          checked={hasLocationOnly}
          onChange={(e) => onHasLocationOnlyChange(e.target.checked)}
        />
        <span>Has location</span>
      </label>
      <input
        className="searchbar-input searchbar-input-location"
        type="search"
        placeholder="Location (city/region)…"
        value={locationQuery}
        onChange={(e) => onLocationQueryChange(e.target.value)}
      />
    </div>
  )
}


