function SidebarItem({ item, handleGenre }) {

  const handleBtn = () => {
    handleGenre(item.genre)
  }

  return (
    <div
      onClick={handleBtn}
      className={`sidebar__genere-item ${item.active && 'genere_item_true'}`}
    >
      {item.genre}
    </div>
  )
}


function Sidebar({ genreArray, handleGenre, handleClear }) {
  // debugger;
  return (
    <>
      <div className="sidebar__genere">
        <div className="sidebar__genre-heading">
        <h2>Genre</h2>
        <p onClick={handleClear}>Clear</p>
        </div>
        
        {
          genreArray.map((item) => {
            return (
              <SidebarItem key={'key' + item.genre} handleGenre={handleGenre} item={item} />
            )
          })
        }
      </div>
    </>
  )
}

export default Sidebar;