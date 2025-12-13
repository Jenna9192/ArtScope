import { useState, useEffect } from 'react';
import './App.css';

// faceted hierarchy

//department
const DEPARTMENT_HIERARCHY = {
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


// time periods
const TIME_HIERARCHY = {
  "Antiquity & Classical Eras": {
    "Early Civilizations": {
      "Before 3000 BCE": { minYear: -9999, maxYear: -3000 },
      "3000–1000 BCE": { minYear: -3000, maxYear: -1000 }
    },
    "Classical Worlds": {
      "Greece & Mediterranean (1000–0 BCE)": { minYear: -1000, maxYear: 0 },
      "Roman & Late Antiquity (0–500 CE)": { minYear: 0, maxYear: 500 }
    }
  },
  "The Medieval World": {
    "Early Medieval": { "500–1000 CE": { minYear: 500, maxYear: 1000 } },
    "High & Late Medieval": { "1000–1400 CE": { minYear: 1000, maxYear: 1400 } }
  },
  "Renaissance to Enlightenment": {
    "Renaissance": { "1400–1600 CE": { minYear: 1400, maxYear: 1600 } },
    "Early Modern Europe": {
      "Baroque & Rococo (1600–1750)": { minYear: 1600, maxYear: 1750 },
      "Age of Enlightenment (1750–1800)": { minYear: 1750, maxYear: 1800 }
    }
  },
  "Industrial & Modern Period": {
    "19th Century": {
      "1800–1850": { minYear: 1800, maxYear: 1850 },
      "1850–1900": { minYear: 1850, maxYear: 1900 }
    },
    "Early 20th Century": { "1900–1945": { minYear: 1900, maxYear: 1945 } },
    "Mid-Century Modern": { "1945–1980": { minYear: 1945, maxYear: 1980 } }
  },
  "Contemporary Era": {
    "Late 20th Century": { "1980–2000": { minYear: 1980, maxYear: 2000 } },
    "21st Century": { "2000–Present": { minYear: 2000, maxYear: 9999 } }
  }
};


// mediums
const MEDIUM_HIERARCHY = {
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


// met api
const API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

// helper to map out the hierarchy
const getItemsFromHierarchy = (hierarchy, level1, level2 = null) => {
  if (level2) return hierarchy[level1]?.[level2] || [];
  const level2Data = hierarchy[level1];
  return level2Data ? Object.values(level2Data).flat() : [];
};

// help to map out the time hierarchy (different since it uses dict instead of list)
const getTimeRange = (level1, level2 = null) => {
  const getData = level2 ? TIME_HIERARCHY[level1]?.[level2] : TIME_HIERARCHY[level1];
  if (!getData) return null;
  
  let minYear = Infinity, maxYear = -Infinity;
  const processRange = (obj) => {
    if (obj.minYear !== undefined) {
      minYear = Math.min(minYear, obj.minYear);
      maxYear = Math.max(maxYear, obj.maxYear);
    } else {
      Object.values(obj).forEach(processRange);
    }
  };
  processRange(getData);
  return { minYear, maxYear, name: level2 || level1 };
};

const checkSelection = (items, selected) => {
  const count = items.filter(i => selected.includes(i)).length;
  return { all: count === items.length && count > 0, partial: count > 0 && count < items.length };
};

const checkTimeSelection = (range, selected) => {
  if (!selected || !range) return { all: false, partial: false };
  const isExact = selected.minYear === range.minYear && selected.maxYear === range.maxYear;
  const isWithin = selected.minYear >= range.minYear && selected.maxYear <= range.maxYear;
  return { all: isExact, partial: isWithin && !isExact };
};


// filter tree component
function FilterTree({ title, hierarchy, selected, onToggle, type = 'radio', icon }) {
  const [expanded, setExpanded] = useState({});
  
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  
  const isTimeType = type === 'time';
  
  // renders the filter on the side
  const renderItems = (items, level1, level2) => (
    <ul className="filter-items">
      {(isTimeType ? Object.entries(items) : items).map(item => {
        const [name, value] = isTimeType ? item : [item, item];
        const isSelected = isTimeType 
          ? selected?.minYear === value.minYear && selected?.maxYear === value.maxYear
          : selected.includes(name);
        
        return (
          <li key={name}>
            <label className={isSelected ? 'selected' : ''}>
              <input
                type={'radio'}
                name={isTimeType ? 'time-period' : undefined}
                checked={isSelected}
                onChange={() => onToggle(isTimeType ? { ...value, name } : name)}
              />
              <span>{name}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );


  // render the second level of hiearchy when rendering
  const renderLevel2 = (level1, level2, data) => {
    const key = `${level1}-${level2}`;
    const items = isTimeType ? data : data;
    const { all, partial } = isTimeType 
      ? checkTimeSelection(getTimeRange(level1, level2), selected)
      : checkSelection(items, selected);

    return (
      <li key={level2}>
        <div className="filter-group">
          <input
            type={'radio'}
            name={isTimeType ? 'time-period' : undefined}
            checked={all}
            ref={el => el && (el.indeterminate = partial && !isTimeType)}
            onChange={() => onToggle(
              isTimeType ? getTimeRange(level1, level2) : items, 
              'level2', level1, level2
            )}
          />
          <button 
            type="button" 
            className={`filter-toggle ${all ? 'selected' : ''}`}
            onClick={() => toggle(key)}
            aria-expanded={expanded[key]}
          >
            <span className="arrow">{expanded[key] ? '▼' : '▶'}</span>
            {level2}
          </button>
        </div>
        {expanded[key] && renderItems(data, level1, level2)}
      </li>
    );
  };

  return (
    <section className="filter-section">
      <h4>{icon} {title} {(isTimeType ? selected : selected.length > 0) && <span className="check">✓</span>}</h4>
      <nav aria-label={`${title} filters`}>
        <ul className="filter-tree">
          {Object.entries(hierarchy).map(([level1, level2Data]) => {
            const { all, partial } = isTimeType
              ? checkTimeSelection(getTimeRange(level1), selected)
              : checkSelection(getItemsFromHierarchy(hierarchy, level1), selected);

            return (
              <li key={level1}>
                <div className="filter-group">
                  <input
                    type={'radio'}
                    name={isTimeType ? 'time-period' : undefined}
                    checked={all}
                    ref={el => el && (el.indeterminate = partial && !isTimeType)}
                    onChange={() => onToggle(
                      isTimeType ? getTimeRange(level1) : getItemsFromHierarchy(hierarchy, level1),
                      'level1', level1
                    )}
                  />
                  <button
                    type="button"
                    className={`filter-toggle ${all ? 'selected' : ''}`}
                    onClick={() => toggle(level1)}
                    aria-expanded={expanded[level1]}
                  >
                    <span className="arrow">{expanded[level1] ? '▼' : '▶'}</span>
                    {level1}
                  </button>
                </div>
                {expanded[level1] && (
                  <ul className="filter-level2">
                    {Object.entries(level2Data).map(([l2, data]) => renderLevel2(level1, l2, data))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}

// the artwork cards as results NOT when you press it
function ArtworkCard({ artwork, onClick }) {
  return (
    <article className="artwork-card" onClick={onClick}>
      <img src={artwork.primaryImageSmall} alt={artwork.title} loading="lazy" />
      <div className="artwork-info">
        <h3>{artwork.title || 'Untitled'}</h3>
        <p className="artist">{artwork.artistDisplayName || 'Unknown Artist'}</p>
        <p className="date">{artwork.objectDate || 'Date unknown'}</p>
      </div>
    </article>
  );
}

// this is for when you press the artwork to give more information 
function ArtworkModal({ artwork, onClose }) {
  if (!artwork) return null;
  
  return (
    <dialog className="modal" open onClick={onClose}>
      <article onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <img src={artwork.primaryImage} alt={artwork.title} />
        <div className="details">
          <h2>{artwork.title}</h2>

          {/* info about the art -> using queries to retrieve from api*/}
          <dl>
            {artwork.artistDisplayName && <><dt>Artist</dt><dd>{artwork.artistDisplayName}</dd></>}
            {artwork.objectDate && <><dt>Date</dt><dd>{artwork.objectDate}</dd></>}
            {artwork.medium && <><dt>Medium</dt><dd>{artwork.medium}</dd></>}
            {artwork.department && <><dt>Department</dt><dd>{artwork.department}</dd></>}
            {artwork.culture && <><dt>Culture</dt><dd>{artwork.culture}</dd></>}
            {artwork.dimensions && <><dt>Dimensions</dt><dd>{artwork.dimensions}</dd></>}
          </dl>

          {artwork.creditLine && <p className="credit">{artwork.creditLine}</p>}

          {/* link to the met page for more details */}
          <a href={artwork.objectURL} target="_blank" rel="noopener noreferrer" className="btn">
            View on Met Website
          </a>
        </div>
      </article>
    </dialog>
  );
}

// this is to show filters are selected
function ActiveFilters({ timePeriod, departments, mediums, onRemove, onClear }) {
  const hasFilters = timePeriod || departments.length > 0 || mediums.length > 0;
  if (!hasFilters) return null;

  return (
    <div className="active-filters">
      {timePeriod && (
        <span className="tag time">
          📅 {timePeriod.name}
          <button onClick={() => onRemove('time')} aria-label="Remove time filter">×</button>
        </span>
      )}
      {departments.map(d => (
        <span key={d} className="tag dept">
          🏛️ {d}
          <button onClick={() => onRemove('dept', d)} aria-label={`Remove ${d}`}>×</button>
        </span>
      ))}
      {mediums.map(m => (
        <span key={m} className="tag medium">
          🎨 {m}
          <button onClick={() => onRemove('medium', m)} aria-label={`Remove ${m}`}>×</button>
        </span>
      ))}
      <button className="clear-all" onClick={onClear}>Clear all</button>
    </div>
  );
}


function App() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [timePeriod, setTimePeriod] = useState(null);
  const [apiDepartments, setApiDepartments] = useState([]);
  const [noResults, setNoResults] = useState(false);

  // get all the departments
  useEffect(() => {
    fetch(`${API_BASE}/departments`)
      .then(r => r.json())
      .then(d => setApiDepartments(d.departments))
      .catch(console.error);
  }, []);

  // get the artworks when filters change
  useEffect(() => {
    if (!departments.length && !mediums.length && !timePeriod) {
      setArtworks([]);
      setNoResults(false);
      return;
    }
    
    // Create abort controller for cleanup
    const abortController = new AbortController();
    
    const doFetch = async () => {
      setLoading(true);
      setNoResults(false);

      try {
        // Build search URL
        let url = `${API_BASE}/search?hasImages=true`;
        
        if (departments.length && apiDepartments.length) {
          const dept = apiDepartments.find(d => d.displayName === departments[0]);
          if (dept) url += `&departmentId=${dept.departmentId}`;
        }
        
        if (timePeriod) {
          url += `&dateBegin=${timePeriod.minYear}&dateEnd=${timePeriod.maxYear}`;
        }
        
        // Limit query terms to avoid URL length issues
        const queryTerms = mediums.slice(0, 5).join(' OR ');
        url += mediums.length ? `&q=${encodeURIComponent(queryTerms)}` : '&q=*';

        const response = await fetch(url, { signal: abortController.signal });
        const { objectIDs } = await response.json();
        
        if (!objectIDs?.length) {
          if (!abortController.signal.aborted) {
            setArtworks([]);
            setNoResults(true);
          }
          return;
        }

        // Fetch individual artworks with validation
        const shuffled = objectIDs.sort(() => 0.5 - Math.random()).slice(0, 100);
        const results = [];
        
        // Capture current filter state for validation
        const filterSnapshot = { departments, mediums, timePeriod };

        for (const id of shuffled) {
          if (abortController.signal.aborted) return;
          if (results.length >= 25) break;

          try {
            const artworkRes = await fetch(`${API_BASE}/objects/${id}`, { signal: abortController.signal });
            const artwork = await artworkRes.json();
            
            if (artwork.primaryImage && matchesFilters(artwork, filterSnapshot)) {
              results.push(artwork);
            }
            await new Promise(r => setTimeout(r, 50));
          } catch (e) {
            if (e.name !== 'AbortError') console.error(`Error fetching ${id}:`, e);
          }
        }

        if (!abortController.signal.aborted) {
          setArtworks(results);
          setNoResults(results.length === 0);
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('Fetch error:', e);
          setNoResults(true);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    doFetch();
    
    // Cleanup: abort fetch if filters change before it completes
    return () => abortController.abort();
    
  }, [departments, mediums, timePeriod, apiDepartments]);

  const matchesFilters = (artwork, filters) => {
    // check time period
    if (filters.timePeriod) {
      const date = artwork.objectBeginDate ?? artwork.objectEndDate;
      if (date === undefined) return false;
      if (date < filters.timePeriod.minYear || date > filters.timePeriod.maxYear) return false;
    }
    
    // check medium
    if (filters.mediums.length) {
      const medium = (artwork.medium || '').toLowerCase();
      if (!filters.mediums.some(m => medium.includes(m.toLowerCase()))) return false;
    }
    
    // check department
    if (filters.departments.length && !filters.departments.includes(artwork.department)) {
      return false;
    }
    
    return true;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      let url = `${API_BASE}/search?hasImages=true&q=${encodeURIComponent(searchQuery)}`;
      if (timePeriod) url += `&dateBegin=${timePeriod.minYear}&dateEnd=${timePeriod.maxYear}`;
      
      const { objectIDs } = await fetch(url).then(r => r.json());
      
      if (!objectIDs?.length) {
        setArtworks([]);
        setNoResults(true);
        setLoading(false);
        return;
      }

      const shuffled = objectIDs.sort(() => 0.5 - Math.random()).slice(0, 30);
      const results = [];

      for (const id of shuffled) {
        if (results.length >= 12) break;
        try {
          const artwork = await fetch(`${API_BASE}/objects/${id}`).then(r => r.json());
          if (artwork.primaryImage) results.push(artwork);
          await new Promise(r => setTimeout(r, 50));
        } catch (e) {
          console.error(e);
        }
      }

      setArtworks(results);
      setNoResults(results.length === 0);
    } catch (e) {
      console.error(e);
      setNoResults(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter toggle handlers
  const handleDeptToggle = (items, level, l1, l2) => {
    if (typeof items === 'string') {
      // Single item toggle
      setDepartments(prev => 
        prev.includes(items) ? prev.filter(d => d !== items) : [...prev, items]
      );
    } else {
      // Group toggle
      const allSelected = items.every(i => departments.includes(i));
      setDepartments(prev => 
        allSelected ? prev.filter(d => !items.includes(d)) : [...new Set([...prev, ...items])]
      );
    }
  };

  const handleMediumToggle = (items, level, l1, l2) => {
    if (typeof items === 'string') {
      setMediums(prev => 
        prev.includes(items) ? prev.filter(m => m !== items) : [...prev, items]
      );
    } else {
      const allSelected = items.every(i => mediums.includes(i));
      setMediums(prev => 
        allSelected ? prev.filter(m => !items.includes(m)) : [...new Set([...prev, ...items])]
      );
    }
  };

  const handleTimeToggle = (range) => {
    setTimePeriod(prev => 
      prev?.minYear === range.minYear && prev?.maxYear === range.maxYear ? null : range
    );
  };

  // handle cleanup of filter when one is removed
  const handleRemoveFilter = (type, value) => {
    if (type === 'time') setTimePeriod(null);
    else if (type === 'dept') setDepartments(prev => prev.filter(d => d !== value));
    else if (type === 'medium') setMediums(prev => prev.filter(m => m !== value));
  };

  const clearFilters = () => {
    setDepartments([]);
    setMediums([]);
    setTimePeriod(null);
  };

  const filterCount = departments.length + mediums.length + (timePeriod ? 1 : 0);

  return (
    <div className="app">
      <header>
        <h1>ArtScope</h1>
        <p>Exploring The Met's Collection</p>
      </header>


      {/* search bar for when user wants to search just by title*/}
      <search className="search-bar">
        <input
          type="search"
          placeholder="Search artworks..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </search>

      <div className="layout">

        {/* this is the filter on the side*/}
        <aside className="sidebar">
          <header>
            <h3>Filters</h3>

            {/* apply number of filters being used*/}
            {filterCount > 0 && (
              <span className="badge">{filterCount}</span>
            )}
          </header>

          {/* all the filters that are active*/}
          <ActiveFilters
            timePeriod={timePeriod}
            departments={departments}
            mediums={mediums}
            onRemove={handleRemoveFilter}
            onClear={clearFilters}
          />

          {/* for time period*/}
          <FilterTree
            title="Time Period"
            icon="📅"
            hierarchy={TIME_HIERARCHY}
            selected={timePeriod}
            onToggle={handleTimeToggle}
            type="time"
          />

          {/* for department*/}
          <FilterTree
            title="Departments"
            icon="🏛️"
            hierarchy={DEPARTMENT_HIERARCHY}
            selected={departments}
            onToggle={handleDeptToggle}
          />

          {/* for mediums*/}
          <FilterTree
            title="Medium"
            icon="🎨"
            hierarchy={MEDIUM_HIERARCHY}
            selected={mediums}
            onToggle={handleMediumToggle}
          />
        </aside>

        {/* results from the filter*/}
        <main>
          
          {/* loading effect*/}
          {loading && (
            <div className="loading">
              <div className="spinner" />
              <p>Loading artworks...</p>
            </div>
          )}


          {/* if there are no results from the selected filter coombo show now artworks found*/}
          {!loading && noResults && (
            <div className="no-results">
              <h3>No Artworks Found</h3>
              <p>Try adjusting your filters.</p>
            </div>
          )}


          {/* this is for when they first appear on the page, prompt the user to use the filters to explore*/}
          {!loading && !noResults && artworks.length === 0 && !filterCount && (
            <div className="empty">
              <h3>Welcome to ArtScope</h3>
              <p>Select filters to explore The Met's collection</p>
            </div>
          )}

          {/* map out the results*/}
          {!loading && artworks.length > 0 && (
            <>
              <p className="results-count">{artworks.length} artworks</p>
              <div className="gallery">

                {/* map out the cards*/}
                {artworks.map(a => (
                  <ArtworkCard key={a.objectID} artwork={a} onClick={() => setSelectedArtwork(a)} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* when you close an artwork*/}
      <ArtworkModal artwork={selectedArtwork} onClose={() => setSelectedArtwork(null)} />

      <footer>
        <p>Designed and Coded By Jenna © 2025</p>
        <p>INFO 202</p>
      </footer>
    </div>
  );
}

export default App;
