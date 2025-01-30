import React from 'react';

function CourseList({ syllabi, isLoading }) {
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (syllabi.length === 0) {
    return <div className="no-courses">No courses found.</div>;
  }

  return (
    <div className="course-list">
      {syllabi.map((syllabus) => (
        <div key={syllabus.id} className="course-item">
          <div className="course-info">
            <h3>{syllabus.course} {syllabus.courseNumber}</h3>
            <p>{syllabus.title}</p>
            <p>Professor: {syllabus.professor}</p>
            <p>{syllabus.semester}</p>
          </div>
          <button className="view-syllabus" onClick={() => window.open(`/api/syllabi/${syllabus.id}`, '_blank')}>
            View Syllabus
          </button>
        </div>
      ))}
    </div>
  );
}

export default CourseList;