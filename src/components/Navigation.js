import React, { useState } from 'react';

function Navigation({ onCategorySelect, categories, onItemSelect, activeFilter, showNavigation }) {
  const [activeCategory, setActiveCategory] = useState(null);

  const handleCategoryClick = (category) => {
    if (activeCategory === category) {
      setActiveCategory(null);
      onCategorySelect(null);
    } else {
      setActiveCategory(category);
      onCategorySelect(category);
    }
  };

  const handleItemClick = (item) => {
    onItemSelect(activeCategory, item);
  };

  return (
    <nav className={`side-nav ${showNavigation ? 'show' : ''}`}>
      <h2>Browse By</h2>
      <ul>
        {Object.keys(categories).map((category) => (
          <li key={category}>
            <button onClick={() => handleCategoryClick(category)}>{category}</button>
          </li>
        ))}
      </ul>
      {activeCategory && categories[activeCategory] && (
        <ul>
          {categories[activeCategory].map((item) => (
            <li key={item}>
              <button 
                onClick={() => handleItemClick(item)}
                className={activeFilter && activeFilter.item === item ? 'active-filter' : ''}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

export default Navigation;