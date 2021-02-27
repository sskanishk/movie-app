function CardWrapper({ movieList }) {
  // debugger;
  return (
    <div style={{padding: "0% 3%"}}>
      <h2>Movies</h2>
      <div className="grid-container grid-container--fill">
        {
          movieList.map((movie) => {
            const convertInHours = (n) => `0${n / 60 ^ 0}`.slice(-2) + ':' + ('0' + n % 60).slice(-2);
            return (
              <div className="grid-element" key={movie.genre}>
                {/* <img src="https://s.studiobinder.com/wp-content/uploads/2017/12/Movie-Poster-Template-Light-With-Image.jpg?x81279" alt={movie.title}/> */}
                <h4 style={{ marginBottom: '0px' }}>{movie.title}</h4>
                <p className="hours">Duration: <span>{convertInHours(parseInt(movie.duration))}</span></p>
                <p className="hours"><span>{movie.genre}</span></p>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}


export default CardWrapper;
