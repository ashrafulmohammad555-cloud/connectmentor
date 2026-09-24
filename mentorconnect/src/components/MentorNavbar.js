// src/components/MentorNavbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function MentorNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/mentor-dashboard" className="text-white text-xl font-semibold">Mentor Dashboard</Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-4">
          <Link to="/mentor-availability" className="text-white hover:underline font-medium">Availability</Link>
          <Link to="/profile" className="text-white hover:underline">Profile</Link>
          <Link to="/messages" className="text-white hover:underline">Messages</Link>
          <Link to="/settings" className="text-white hover:underline">Settings</Link>
          <Link to="/" className="text-white hover:underline">Logout</Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMenu}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-blue-700 mt-2`}>
        <Link to="/mentor-availability" className="block px-4 py-2 text-white hover:bg-blue-800 font-medium">Availability</Link>
        <Link to="/profile" className="block px-4 py-2 text-white hover:bg-blue-800">Profile</Link>
        <Link to="/messages" className="block px-4 py-2 text-white hover:bg-blue-800">Messages</Link>
        <Link to="/settings" className="block px-4 py-2 text-white hover:bg-blue-800">Settings</Link>
        <Link to="/" className="block px-4 py-2 text-white hover:bg-blue-800">Logout</Link>
      </div>
    </nav>
  );
}

export default MentorNavbar;
