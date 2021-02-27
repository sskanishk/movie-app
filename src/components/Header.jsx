function Header({ handleSearch }) {
  return (
    <div className="searchbox-wrapper">
      <div className="searchbox">
        <input
          id="search"
          type="text"
          placeholder="Search..."
          name="search"
          className="search"
          onChange={(e) => handleSearch(e.target.value)} />
      </div>
    </div>
  )
}

export default Header;