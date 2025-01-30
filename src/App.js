import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import Navigation from './components/Navigation';
import CourseList from './components/CourseList';
import UploadForm from './components/UploadForm';
import Pagination from './components/Pagination';

function App() {
  const [allSyllabi, setAllSyllabi] = useState([]);
  const [filteredSyllabi, setFilteredSyllabi] = useState([]);
  const [displayedSyllabi, setDisplayedSyllabi] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [categories, setCategories] = useState({
    Departments: [],
    Courses: [],
    Semesters: [],
    Professors: []
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchAllSyllabi();
    fetchAllCategories();
  }, []);

  useEffect(() => {
    filterSyllabi();
  }, [allSyllabi, searchTerm, activeFilter]);

  useEffect(() => {
    paginateSyllabi();
  }, [filteredSyllabi, currentPage]);

  const fetchAllSyllabi = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/syllabi');
      const data = await response.json();
      setAllSyllabi(data.syllabi);
    } catch (error) {
      console.error('Error fetching syllabi:', error);
    }
    setIsLoading(false);
  };

  const fetchAllCategories = async () => {
    try {
      const [departments, courses, semesters, professors] = await Promise.all([
        fetch('/api/departments').then(res => res.json()),
        fetch('/api/courses').then(res => res.json()),
        fetch('/api/semesters').then(res => res.json()),
        fetch('/api/professors').then(res => res.json())
      ]);

      setCategories({
        Departments: departments,
        Courses: courses,
        Semesters: semesters,
        Professors: professors
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterSyllabi = () => {
    let filtered = allSyllabi.filter((syllabus) => {
      const matchesSearch = `${syllabus.course} ${syllabus.courseNumber} ${syllabus.title} ${syllabus.professor}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      if (activeFilter) {
        if (activeFilter.category === 'Departments') {
          return matchesSearch && syllabus.course === activeFilter.item;
        } else if (activeFilter.category === 'Courses') {
          return matchesSearch && `${syllabus.course} ${syllabus.courseNumber}` === activeFilter.item;
        } else if (activeFilter.category === 'Semesters') {
          return matchesSearch && syllabus.semester === activeFilter.item;
        } else if (activeFilter.category === 'Professors') {
          return matchesSearch && syllabus.professor === activeFilter.item;
        }
      }
      
      return matchesSearch;
    });

    setFilteredSyllabi(filtered);
    setCurrentPage(1);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)));
  };

  const paginateSyllabi = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedSyllabi(filteredSyllabi.slice(startIndex, endIndex));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setActiveFilter(null);
    setCurrentPage(1);
  };

  const handleUpload = (newSyllabus) => {
    setAllSyllabi(prev => [newSyllabus, ...prev]);
    setShowUploadForm(false);
    fetchAllCategories();
  };

  const handleCategorySelect = (category) => {
    setActiveCategory(category);
    setActiveFilter(null);
    setCurrentPage(1);
  };

  const handleItemSelect = (category, item) => {
    setActiveFilter({ category, item });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const toggleNavigation = () => {
    setShowNavigation(!showNavigation);
  };

  return (
    <div className="App">
      <Header onToggleNavigation={toggleNavigation} />
      <div className="main-content">
        <Navigation 
          onCategorySelect={handleCategorySelect} 
          categories={categories}
          onItemSelect={handleItemSelect}
          activeFilter={activeFilter}
          showNavigation={showNavigation}
        />
        <div className="content-area">
          <SearchBar onSearch={handleSearch} />
          <button className="toggle-upload-form" onClick={() => setShowUploadForm(!showUploadForm)}>
            {showUploadForm ? 'Hide Upload Form' : 'Show Upload Form'}
          </button>
          {showUploadForm && <UploadForm onUpload={handleUpload} />}
          <CourseList 
            syllabi={displayedSyllabi} 
            isLoading={isLoading}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}

export default App;