import { useEffect, useState } from 'react';
import './App.css';

import CardWrapper from './components/CardWrapper';
import Header from './components/Header';
import Sidebar from './components/Sidebar';


const apiData = {
  "list": [
            {
                "title": "Avengers: Endgame",
                "duration": 135,
                "genre": "Action"
            },
            {
                "title": "After",
                "duration": 150,
                "genre": "Drama"
            },
            {
                "title": "The Hole in the Ground",
                "duration": 125,
                "genre": "Horror"
            },
            {
                "title": "Dragon: The hidden world",
                "duration": 185,
                "genre": "Animation"
            },
            {
                "title": "Hellboy",
                "duration": 115,
                "genre": "Thriller"
            },
            {
                "title": "A star is born",
                "duration": 135,
                "genre": "Fantasy"
            }
          ],
          "createdAt": "2021-02-25T12:25:25.921Z",
          "updatedAt": "2021-02-25T12:25:25.921Z"
}

const genreArray = apiData.list.map((item) => {
  return(
    { genre: item.genre, active: false }
  )
})

function App() {

  const [ movieData, setMovieData ] = useState(apiData.list);
  const [ genreData, setgenreData ] = useState(genreArray)

  useEffect(() => {
    setMovieData(apiData.list)
    setgenreData(genreArray)
  },[]);

  
  const handleChange = (searchValue) => {

    // handle search function 
    setMovieData(apiData.list.filter((item) => {
      return (
        item.title.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()) || item.genre.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
      )
    }))

    // Remove selected Genre (sidebar)
    setgenreData(genreArray);
  }
  

  const handleClear = () => {
    setgenreData(genreArray);
    setMovieData(apiData.list);
  }

  

  const handleClick=(genre)=>{

    // set active genre (sidebar)
    setgenreData(genreArray.map((item) => {
      // debugger;
      if(item.genre === genre) {
        return (
          {...item , active: !item.active}
        )
      }
      return item;
    }))

    // set genre based moview data
    setMovieData(apiData.list.filter((item) => {
      // debugger;
      return (
        item.genre === genre
      )
    }))

  }



  

  return (
    <>
      <Header handleSearch={handleChange}/>
      <div className="container">
        <Sidebar genreArray={genreData} handleGenre={handleClick} handleClear={handleClear}/>
        {
          movieData.length === 0 ?
          <div className="no__item"><p>No data Available</p></div>
          : <CardWrapper movieList={movieData} />
        }
        
      </div>
    </>
  );
}

export default App;
