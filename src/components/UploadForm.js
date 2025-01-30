import React, { useState } from 'react';

function UploadForm({ onUpload }) {
  const [course, setCourse] = useState('');
  const [courseNumber, setCourseNumber] = useState('');
  const [title, setTitle] = useState('');
  const [professor, setProfessor] = useState('');
  const [semester, setSemester] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('course', course.toUpperCase()); // Capitalize course name
    formData.append('courseNumber', courseNumber);
    formData.append('title', title);
    formData.append('professor', professor);
    formData.append('semester', semester);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const newSyllabus = await response.json();
        onUpload(newSyllabus);
        alert('Syllabus uploaded successfully');
        // Reset form
        setCourse('');
        setCourseNumber('');
        setTitle('');
        setProfessor('');
        setSemester('');
        setFile(null);
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Upload failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <input
        type="text"
        placeholder="Course (e.g., CSE)"
        value={course}
        onChange={(e) => setCourse(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Course Number (e.g., 101)"
        value={courseNumber}
        onChange={(e) => setCourseNumber(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Course Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Professor"
        value={professor}
        onChange={(e) => setProfessor(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Semester (e.g., Fall 2023)"
        value={semester}
        onChange={(e) => setSemester(e.target.value)}
        required
      />
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        required
      />
      <button type="submit">Upload Syllabus</button>
    </form>
  );
}

export default UploadForm;
