import './SearchBar.css'

interface SearchBarProps {
  query: string
  onQueryChange: (value: string) => void
  videosOnly: boolean
  onVideosOnlyChange: (value: boolean) => void
}

export function SearchBar({ query, onQueryChange, videosOnly, onVideosOnlyChange }: SearchBarProps) {
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
    </div>
  )
}


