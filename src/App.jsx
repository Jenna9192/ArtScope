import { useState, useEffect } from 'react';
import './App.css'

function App() {
  const [artworks, setArtworks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedMediums, setSelectedMediums] = useState([]);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/departments');
      const data = await response.json();
      setDepartments(data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const departmentHierarchy = {
    "Medieval to Early Modern": {
      "Medieval Europe": ["Medieval Art", "The Cloisters"],
      "European Traditions": ["Arms and Armor", "Musical Instruments"],
      "Renaissance to 18th Century Europe": ["European Sculpture and Decorative Arts", "The Robert Lehman Collection"]
    },
    "Modern & Contemporary": {
      "Modern Art": ["Modern Art", "Photographs", "Drawings and Prints"],
      "Fashion & Material Culture": ["The Costume Institute"],
      "Archives": ["The Libraries"]
    },
    "Geographic Cultural Regions": {
      "Americas & Europe": ["American Decorative Arts", "European Paintings", "Greek and Roman Art"],
      "Africa & Asia": ["Arts of Africa, Oceania, and the Americas", "Egyptian Art"],
      "Asian": ["Asian Art", "Islamic Art", "Ancient Near Eastern Art"]
    }
  };

  const timeHierarchy = {
    "Antiquity & Classical Eras": {
      "Early Civilizations": {
        "Before 3000 BCE": { "minYear": -9999, "maxYear": -3000 },
        "3000–1000 BCE": { "minYear": -3000, "maxYear": -1000 }
      },
      "Classical Worlds": {
        "Greece & Mediterranean (1000–0 BCE)": { "minYear": -1000, "maxYear": 0 },
        "Roman & Late Antiquity (0–500 CE)": { "minYear": 0, "maxYear": 500 }
      }
    },
    "The Medieval World": {
      "Early Medieval": {
        "500–1000 CE": { "minYear": 500, "maxYear": 1000 }
      },
      "High & Late Medieval": {
        "1000–1400 CE": { "minYear": 1000, "maxYear": 1400 }
      }
    },
    "Renaissance to Enlightenment": {
      "Renaissance": {
        "1400–1600 CE": { "minYear": 1400, "maxYear": 1600 }
      },
      "Early Modern Europe": {
        "Baroque & Rococo (1600–1750)": { "minYear": 1600, "maxYear": 1750 },
        "Age of Enlightenment (1750–1800)": { "minYear": 1750, "maxYear": 1800 }
      }
    },
    "Industrial & Modern Period": {
      "19th Century": {
        "1800–1850": { "minYear": 1800, "maxYear": 1850 },
        "1850–1900": { "minYear": 1850, "maxYear": 1900 }
      },
      "Early 20th Century": {
        "1900–1945": { "minYear": 1900, "maxYear": 1945 }
      },
      "Mid-Century Modern": {
        "1945–1980": { "minYear": 1945, "maxYear": 1980 }
      }
    },
    "Contemporary Era": {
      "Late 20th Century": {
        "1980–2000": { "minYear": 1980, "maxYear": 2000 }
      },
      "21st Century": {
        "2000–Present": { "minYear": 2000, "maxYear": 9999 }
      }
    }
  };

  const mediumHierarchy = {
    "Materials": {
      "Metals": ["gold", "silver", "metal", "steel", "copper", "nickel", "brass", "iron", "bronze", "alloy", "metallic"],
      "Ceramics & Glass": ["porcelain", "stoneware", "earthenware", "slip", "glaze", "enamel", "glass"],
      "Textiles & Organics": ["silk", "cotton", "wool", "linen", "leather", "fiber", "thread", "ivory", "mother-of-pearl", "shell", "beads"],
      "Plastics & Synthetics": ["plastic", "synthetic"],
      "Wood": ["wood"]
    },
    "Supports & Presentation": {
      "Paper & Sheet Supports": ["paper", "wove", "laid"],
      "Framing & Mounting": ["framing", "mounted"]
    },
    "Techniques": {
      "Drawing & Painting": ["ink", "pen", "graphite", "chalk", "wash", "brush", "illustrations", "watercolor", "gouache", "painted", "pigment", "oil"],
      "Printmaking": ["etching", "engraving", "drypoint", "aquatint", "lithograph", "woodcut"],
      "Surface Treatment & Construction": ["gilt", "gilded", "traces", "decoration", "lacquer", "carved", "cut", "lines", "heightened", "printed", "state"]
    }
  };

  const filteredArtworks = isSearchMode ? searchResults : artworks;

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setIsSearchMode(true);
    const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';
    
    try {
      const searchResponse = await fetch(
        `${baseUrl}/search?hasImages=true&q=${encodeURIComponent(searchQuery)}`
      );
      const searchData = await searchResponse.json();
      
      if (searchData.objectIDs && searchData.objectIDs.length > 0) {
        const shuffled = searchData.objectIDs.sort(() => 0.5 - Math.random());
        const selectedIds = shuffled.slice(0, 12);
        const results = [];
        
        for (const id of selectedIds) {
          try {
            const artworkResponse = await fetch(`${baseUrl}/objects/${id}`);
            const artwork = await artworkResponse.json();
            
            if (artwork.primaryImage) {
              results.push(artwork);
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (err) {
            console.error(`Error fetching artwork ${id}:`, err);
          }
        }
        
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching artworks:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim() === '') {
      setIsSearchMode(false);
      setSearchResults([]);
    }
  };

  const fetchArtworksForDepartments = async (departmentNames) => {
    setLoading(true);
    const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';
    const newArtworks = [];

    for (const deptName of departmentNames) {
      const dept = departments.find(d => d.displayName === deptName);
      if (!dept) continue;

      try {
        let searchUrl = `${baseUrl}/search?departmentId=${dept.departmentId}&hasImages=true&q=`;
        
        // Add medium filter if any mediums are selected
        if (selectedMediums.length > 0) {
          searchUrl += selectedMediums.join(' OR ');
        } else {
          searchUrl += '*';
        }
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (searchData.objectIDs && searchData.objectIDs.length > 0) {
          const shuffled = searchData.objectIDs.sort(() => 0.5 - Math.random());
          
          // Fetch more artworks to filter through if medium filter is active
          const fetchCount = selectedMediums.length > 0 ? 100 : 25;
          const selectedIds = shuffled.slice(0, fetchCount);
          
          for (const id of selectedIds) {
            // Stop if we have enough artworks
            if (newArtworks.length >= 25) break;
            
            try {
              const artworkResponse = await fetch(`${baseUrl}/objects/${id}`);
              const artwork = await artworkResponse.json();
              
              // Check if artwork has image and matches medium filter
              if (artwork.primaryImage) {
                if (selectedMediums.length === 0) {
                  newArtworks.push(artwork);
                } else {
                  // Strict validation: check if ANY selected medium term is in the artwork's medium
                  const mediumLower = (artwork.medium || '').toLowerCase();
                  const matchesMedium = selectedMediums.some(medium => 
                    mediumLower.includes(medium.toLowerCase())
                  );
                  
                  if (matchesMedium) {
                    newArtworks.push(artwork);
                  }
                }
              }
              
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (err) {
              console.error(`Error fetching artwork ${id}:`, err);
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching from department ${deptName}:`, err);
      }
    }
    
    setArtworks(newArtworks);
    setLoading(false);
  };

  const toggleCategory = (level1, level2 = null) => {
    const key = level2 ? `${level1}-${level2}` : level1;
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleDepartment = (deptName) => {
    setArtworks([]); // Clear artworks first
    
    if (selectedDepartments.includes(deptName)) {
      const newDepts = selectedDepartments.filter(d => d !== deptName);
      setSelectedDepartments(newDepts);
      
      // Re-fetch remaining departments
      if (newDepts.length > 0) {
        fetchArtworksForDepartments(newDepts);
      } else if (selectedMediums.length > 0) {
        // If no departments left but mediums selected, fetch by medium
        fetchArtworksByMedium();
      }
    } else {
      const newDepts = [...selectedDepartments, deptName];
      setSelectedDepartments(newDepts);
      fetchArtworksForDepartments(newDepts);
    }
  };

  const toggleMedium = (mediumTerm) => {
    setArtworks([]); // Clear artworks first
    
    if (selectedMediums.includes(mediumTerm)) {
      const newMediums = selectedMediums.filter(m => m !== mediumTerm);
      setSelectedMediums(newMediums);
      
      // Re-fetch with updated medium filters
      if (selectedDepartments.length > 0) {
        fetchArtworksForDepartments(selectedDepartments);
      } else if (newMediums.length > 0) {
        fetchArtworksByMedium();
      }
    } else {
      const newMediums = [...selectedMediums, mediumTerm];
      setSelectedMediums(newMediums);
      
      // Will trigger useEffect to re-fetch
    }
  };

  // Re-fetch artworks when medium filter changes
  useEffect(() => {
    setArtworks([]); // Clear artworks first
    
    if (selectedDepartments.length > 0) {
      fetchArtworksForDepartments(selectedDepartments);
    } else if (selectedMediums.length > 0) {
      // If only medium is selected, fetch artworks by medium alone
      fetchArtworksByMedium();
    }
  }, [selectedMediums]);

  const fetchArtworksByMedium = async () => {
    if (selectedMediums.length === 0) return;
    
    setLoading(true);
    const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';
    const newArtworks = [];

    try {
      const searchUrl = `${baseUrl}/search?hasImages=true&q=${selectedMediums.join(' OR ')}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.objectIDs && searchData.objectIDs.length > 0) {
        const shuffled = searchData.objectIDs.sort(() => 0.5 - Math.random());
        const selectedIds = shuffled.slice(0, 100); // Fetch more to filter through
        
        for (const id of selectedIds) {
          // Stop if we have enough artworks
          if (newArtworks.length >= 25) break;
          
          try {
            const artworkResponse = await fetch(`${baseUrl}/objects/${id}`);
            const artwork = await artworkResponse.json();
            
            if (artwork.primaryImage) {
              // Strict validation: check if ANY selected medium term is in the artwork's medium
              const mediumLower = (artwork.medium || '').toLowerCase();
              const matchesMedium = selectedMediums.some(medium => 
                mediumLower.includes(medium.toLowerCase())
              );
              
              if (matchesMedium) {
                newArtworks.push(artwork);
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (err) {
            console.error(`Error fetching artwork ${id}:`, err);
          }
        }
      }
      
      setArtworks(newArtworks);
    } catch (error) {
      console.error('Error fetching artworks by medium:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedDepartments([]);
    setSelectedMediums([]);
    setArtworks([]);
  };

  return (
    <>
      <div className="app">
        <header className="header">
          <h1>ArtScope</h1>
          <h2>Exploring The Met's Collection</h2>
        </header>

        <section className="search">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by title, artist, medium, culture, or department..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
            />
            <button 
              onClick={handleSearch} 
              disabled={loading}
              className="search-button"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </section>

        <div className="content-wrapper">
          <aside className="sidebar">
            <div className="sidebar-header">
              <h3>Filters</h3>
              {(selectedDepartments.length > 0 || selectedMediums.length > 0) && (
                <div className="filter-badge">
                  <span className="filter-count">{selectedDepartments.length + selectedMediums.length}</span>
                  <button onClick={clearFilters} className="clear-filters">
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="filter-section">
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#222' }}>Departments</h4>
              {Object.entries(departmentHierarchy).map(([level1, level2Data]) => (
                <div key={level1} className="category-level1">
                  <div
                    className="category-header"
                    onClick={() => toggleCategory(level1)}
                  >
                    <span className={`category-arrow ${expandedCategories[level1] ? 'expanded' : ''}`}>
                      ▶
                    </span>
                    {level1}
                  </div>

                  {expandedCategories[level1] && (
                    <div className="category-level2">
                      {Object.entries(level2Data).map(([level2, departments]) => (
                        <div key={level2}>
                          <div
                            className="subcategory-header"
                            onClick={() => toggleCategory(level1, level2)}
                          >
                            <span className={`category-arrow ${expandedCategories[`${level1}-${level2}`] ? 'expanded' : ''}`}>
                              ▶
                            </span>
                            {level2}
                          </div>

                          {expandedCategories[`${level1}-${level2}`] && (
                            <div className="departments-list">
                              {departments.map((dept) => (
                                <div key={dept} className="department-item">
                                  <input
                                    type="checkbox"
                                    className="department-checkbox"
                                    checked={selectedDepartments.includes(dept)}
                                    onChange={() => toggleDepartment(dept)}
                                    id={`dept-${dept}`}
                                  />
                                  <label
                                    htmlFor={`dept-${dept}`}
                                    className="department-label"
                                  >
                                    {dept}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="filter-divider"></div>

            <div className="filter-section">
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#222' }}>Medium</h4>
              {Object.entries(mediumHierarchy).map(([level1, level2Data]) => (
                <div key={level1} className="category-level1">
                  <div
                    className="category-header"
                    onClick={() => toggleCategory(`medium-${level1}`)}
                  >
                    <span className={`category-arrow ${expandedCategories[`medium-${level1}`] ? 'expanded' : ''}`}>
                      ▶
                    </span>
                    {level1}
                  </div>

                  {expandedCategories[`medium-${level1}`] && (
                    <div className="category-level2">
                      {Object.entries(level2Data).map(([level2, mediumTerms]) => (
                        <div key={level2}>
                          <div
                            className="subcategory-header"
                            onClick={() => toggleCategory(`medium-${level1}`, level2)}
                          >
                            <span className={`category-arrow ${expandedCategories[`medium-${level1}-${level2}`] ? 'expanded' : ''}`}>
                              ▶
                            </span>
                            {level2}
                          </div>

                          {expandedCategories[`medium-${level1}-${level2}`] && (
                            <div className="departments-list">
                              {mediumTerms.map((term) => (
                                <div key={term} className="department-item">
                                  <input
                                    type="checkbox"
                                    className="department-checkbox"
                                    checked={selectedMediums.includes(term)}
                                    onChange={() => toggleMedium(term)}
                                    id={`medium-${term}`}
                                  />
                                  <label
                                    htmlFor={`medium-${term}`}
                                    className="department-label"
                                  >
                                    {term}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          <main className="main">
            {artworks.length === 0 && !loading && !isSearchMode && (
              <div className="empty-state">
                <h3>Welcome to ArtScope</h3>
                <p>Select departments from the left sidebar to explore The Met's collection</p>
              </div>
            )}

            {(artworks.length > 0 || loading || isSearchMode) && (
              <>
                <div className="results-header">
                  <div className="results-info">
                    {loading ? (
                      <span className="loading-indicator">
                        {isSearchMode ? 'Searching...' : 'Loading artworks...'}
                      </span>
                    ) : (
                      <span>
                        {isSearchMode && `Search results for "${searchQuery}": `}
                        {filteredArtworks.length} artworks displayed
                      </span>
                    )}
                  </div>
                </div>

                <div className="gallery">
                  {filteredArtworks.map((artwork) => (
                    <div
                      key={artwork.objectID}
                      onClick={() => setSelectedArtwork(artwork)}
                      className="artwork-card"
                    >
                      <img
                        src={artwork.primaryImageSmall}
                        alt={artwork.title}
                        className="artwork-image"
                      />
                      <div className="artwork-info">
                        <h3 className="artwork-title">{artwork.title || 'Untitled'}</h3>
                        <p className="artwork-artist">{artwork.artistDisplayName || 'Unknown Artist'}</p>
                        <p className="artwork-date">{artwork.objectDate || 'Date unknown'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredArtworks.length === 0 && !loading && (
                  <div className="no-results">
                    No artworks match your search. Try a different term.
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {selectedArtwork && (
          <div className="modal-overlay" onClick={() => setSelectedArtwork(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedArtwork(null)}
                className="modal-close"
              >
                ×
              </button>
              <img
                src={selectedArtwork.primaryImage}
                alt={selectedArtwork.title}
                className="modal-image"
              />
              <div className="modal-details">
                <h2 className="modal-title">{selectedArtwork.title}</h2>
                <div className="modal-info">
                  {selectedArtwork.artistDisplayName && (
                    <p><strong>Artist:</strong> {selectedArtwork.artistDisplayName}</p>
                  )}
                  {selectedArtwork.objectDate && (
                    <p><strong>Date:</strong> {selectedArtwork.objectDate}</p>
                  )}
                  {selectedArtwork.medium && (
                    <p><strong>Medium:</strong> {selectedArtwork.medium}</p>
                  )}
                  {selectedArtwork.department && (
                    <p><strong>Department:</strong> {selectedArtwork.department}</p>
                  )}
                  {selectedArtwork.culture && (
                    <p><strong>Culture:</strong> {selectedArtwork.culture}</p>
                  )}
                  {selectedArtwork.dimensions && (
                    <p><strong>Dimensions:</strong> {selectedArtwork.dimensions}</p>
                  )}
                  {selectedArtwork.creditLine && (
                    <p className="credit-line">{selectedArtwork.creditLine}</p>
                  )}
                </div>
                <a
                  href={selectedArtwork.objectURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-link"
                >
                  View on Met Website
                </a>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">
          <p>Designed and Coded By Jenna © 2025</p>
          <p>INFO 202</p>
        </footer>
      </div>
    </>
  );
}

export default App;