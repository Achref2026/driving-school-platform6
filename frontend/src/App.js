import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import NewManagerDashboard from './NewManagerDashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import DocumentUpload from './components/DocumentUpload';

// Get backend URL from environment
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  // State management
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [language, setLanguage] = useState('en');
  const [drivingSchools, setDrivingSchools] = useState([]);
  const [states, setStates] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [documentUploadModal, setDocumentUploadModal] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] = useState('');
  const [userDocuments, setUserDocuments] = useState([]);
  const [showSchoolRegistrationModal, setShowSchoolRegistrationModal] = useState(false);
  const [showSchoolPhotoModal, setShowSchoolPhotoModal] = useState(false);
  const [schoolPhotoType, setSchoolPhotoType] = useState('logo');
  const [userSchool, setUserSchool] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_prev: false,
    items_per_page: 20
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    min_price: '',
    max_price: '',
    min_rating: '',
    sort_by: 'name',
    sort_order: 'asc',
    page: 1,
    limit: 20
  });

  // Auth form data
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: 'male',
    state: '',
    profile_photo: null
  });

  // Driving school registration data
  const [schoolData, setSchoolData] = useState({
    name: '',
    address: '',
    state: '',
    phone: '',
    email: '',
    description: '',
    price: '',
    latitude: '',
    longitude: ''
  });

  // Translations
  const translations = {
    en: {
      home: "Home",
      schools: "Schools",
      login: "Login",
      register: "Register",
      logout: "Logout",
      dashboard: "Dashboard",
      findSchools: "Find Driving Schools",
      selectState: "Select State",
      searchPlaceholder: "Search schools...",
      enrollNow: "Enroll Now",
      viewDetails: "View Details",
      email: "Email",
      password: "Password",
      firstName: "First Name",
      lastName: "Last Name",
      phone: "Phone",
      address: "Address",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      state: "State",
      heroTitle: "Find the Best Driving Schools in Algeria",
      heroSubtitle: "Choose from driving schools across all 58 Algerian states",
      heroDescription: "Connect with certified driving schools across all wilayas. Learn theory, practice parking, master road skills, and earn your license with confidence.",
      getStarted: "Get Started",
      features: "Features",
      contactUs: "Contact Us",
      contactDesc: "Ready to start your driving journey? Get in touch with us today!",
      contactEmail: "info@autokademia.dz",
      contactPhone: "+213 (0) 21 123 456",
      contactAddress: "Algiers, Algeria",
      featureTitle1: "Theory Courses",
      featureDesc1: "Learn road signs, traffic rules, and driving theory through online courses",
      featureTitle2: "Practical Training",
      featureDesc2: "Get hands-on experience with park and road courses from certified instructors",
      featureTitle3: "Quality Assurance",
      featureDesc3: "Read reviews and ratings from real students to make the best choice",
      featureTitle4: "How it Works",
      uploadDocuments: "Upload Documents",
      profilePhoto: "Profile Photo",
      idCard: "ID Card",
      medicalCertificate: "Medical Certificate",
      residenceCertificate: "Residence Certificate",
      upload: "Upload",
      cancel: "Cancel",
      documentUploaded: "Document uploaded successfully!",
      documentsRequired: "Documents Required",
      documentsStatus: "Documents Status",
      verified: "Verified",
      pending: "Pending Verification",
      uploadFile: "Upload File",
      registerSchool: "Register Your Driving School",
      schoolName: "School Name",
      schoolDescription: "Description",
      schoolPrice: "Course Price (DA)",
      latitude: "Latitude (Optional)",
      longitude: "Longitude (Optional)",
      registerSchoolBtn: "Register School",
      uploadSchoolPhotos: "Upload School Photos",
      uploadLogo: "Upload Logo",
      uploadPhoto: "Upload Photo",
      becomePartner: "Become a Partner",
      partnerTitle: "Start Your Own Driving School",
      partnerSubtitle: "Join Algeria's leading driving education platform",
      partnerDesc: "Register your driving school and connect with students across your wilaya. Manage enrollments, track progress, and grow your business with our comprehensive platform."
    }
  };

  const t = translations[language];

  // Initialize app
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setCurrentPage('dashboard');
    }
    
    fetchStates();
  }, []);

  // Fetch states
  const fetchStates = async () => {
    try {
      const response = await api.get('/api/states');
      setStates(response.data.states);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        setErrorMessage('Failed to load dashboard data: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch user documents
  const fetchUserDocuments = async () => {
    try {
      const response = await api.get('/api/documents');
      setUserDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  // Fetch user's driving school (for managers)
  const fetchUserSchool = async () => {
    try {
      if (user && user.role === 'manager') {
        const response = await api.get('/api/driving-schools');
        const userSchoolData = response.data.schools.find(school => school.manager_id === user.id);
        setUserSchool(userSchoolData);
      }
    } catch (error) {
      console.error('Error fetching user school:', error);
    }
  };

  // Fetch manager-specific data
  const fetchManagerData = async () => {
    try {
      if (user && user.role === 'manager') {
        await fetchUserSchool();
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
    }
  };

  // Fetch driving schools
  const fetchDrivingSchools = async (customFilters = {}) => {
    try {
      setLoading(true);
      const queryParams = { ...filters, ...customFilters };
      
      const cleanedParams = {};
      Object.keys(queryParams).forEach(key => {
        const value = queryParams[key];
        if (value !== '' && value !== null && value !== undefined) {
          if ((key === 'min_price' || key === 'max_price' || key === 'min_rating') && typeof value === 'string' && value.trim() !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              cleanedParams[key] = numValue;
            }
          } else {
            cleanedParams[key] = value;
          }
        }
      });
      
      const response = await api.get('/api/driving-schools', { params: cleanedParams });
      setDrivingSchools(response.data.schools || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching driving schools:', error);
      let errorMessage = 'Failed to load driving schools';
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage += ': ' + error.response.data.detail;
        } else {
          errorMessage += ': ' + JSON.stringify(error.response.data.detail);
        }
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle authentication
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      
      Object.keys(authData).forEach(key => {
        if (key === 'profile_photo' && authData[key]) {
          formData.append(key, authData[key]);
        } else if (key !== 'profile_photo') {
          formData.append(key, authData[key]);
        }
      });

      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      
      const response = await api.post(endpoint, 
        authMode === 'login' ? 
          { email: authData.email, password: authData.password } : 
          formData,
        authMode === 'login' ? 
          { headers: { 'Content-Type': 'application/json' } } :
          { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.user && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        setUser(response.data.user);
        setShowAuthModal(false);
        setCurrentPage('dashboard');
        setSuccessMessage(response.data.message);
        
        setAuthData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          date_of_birth: '',
          gender: 'male',
          state: '',
          profile_photo: null
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = formatErrorMessage(error, 'Authentication failed');
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
    setCurrentPage('home');
    setDashboardData(null);
    setUserSchool(null);
  };

  // Handle enrollment
  const handleEnroll = async (schoolId) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/enroll', { school_id: schoolId });
      setSuccessMessage('Enrollment successful! Please upload required documents.');
      setCurrentPage('dashboard');
      fetchDashboardData();
    } catch (error) {
      const errorMessage = formatErrorMessage(error, 'Enrollment failed');
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format error messages
  const formatErrorMessage = (error, defaultMessage = 'An error occurred') => {
    if (!error.response?.data?.detail) {
      return defaultMessage;
    }
    
    const detail = error.response.data.detail;
    
    if (Array.isArray(detail)) {
      return detail.map(err => {
        if (err.msg && err.loc) {
          const field = err.loc[err.loc.length - 1];
          return `${field}: ${err.msg}`;
        }
        return err.msg || 'Validation error';
      }).join(', ');
    }
    
    if (typeof detail === 'string') {
      return detail;
    }
    
    if (typeof detail === 'object' && detail.msg) {
      return detail.msg;
    }
    
    return defaultMessage;
  };

  // Handle driving school registration
  const handleSchoolRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await api.post('/api/driving-schools', schoolData);
      setSuccessMessage('Driving school registered successfully! You can now upload photos.');
      setShowSchoolRegistrationModal(false);
      
      const updatedUser = { ...user, role: 'manager' };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      setCurrentPage('dashboard');
      fetchDashboardData();
      fetchUserSchool();
      
      setSchoolData({
        name: '',
        address: '',
        state: '',
        phone: '',
        email: '',
        description: '',
        price: '',
        latitude: '',
        longitude: ''
      });
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle school photo upload
  const handleSchoolPhotoUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      setLoading(true);
      const response = await api.post(`/api/driving-schools/${userSchool.id}/upload-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMessage('Photo uploaded successfully!');
      setShowSchoolPhotoModal(false);
      fetchUserSchool();
    } catch (error) {
      const errorMessage = formatErrorMessage(error, 'Photo upload failed');
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle document upload success
  const handleDocumentUploadSuccess = async (uploadData, documentType) => {
    setSuccessMessage(`${documentType.replace('_', ' ')} uploaded successfully!`);
    await fetchUserDocuments();
    await fetchDashboardData();
  };

  // Handle document upload cancel
  const handleDocumentUploadCancel = () => {
    setDocumentUploadModal(false);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      state: '',
      min_price: '',
      max_price: '',
      min_rating: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 20
    });
  };

  // Apply filters
  useEffect(() => {
    if (currentPage === 'schools') {
      fetchDrivingSchools();
    }
  }, [filters, currentPage]);

  // Load dashboard data when page changes
  useEffect(() => {
    if (currentPage === 'dashboard' && user) {
      fetchDashboardData();
      fetchUserDocuments();
      fetchManagerData();
    }
  }, [currentPage, user]);

  // Fetch manager data when user role changes to manager
  useEffect(() => {
    if (user && user.role === 'manager') {
      fetchManagerData();
    }
  }, [user?.role]);

  // Navigation Component
  const renderNavigation = () => (
    <nav className="bg-blue-600 text-white shadow-lg fixed-top">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <a 
            href="#" 
            onClick={() => setCurrentPage(user ? 'dashboard' : 'home')}
            className="text-xl font-bold text-white hover:text-blue-200 transition-colors"
          >
            🚗 Driving Schools Algeria
          </a>
          
          <div className="flex items-center space-x-6">
            {!user && (
              <a 
                href="#" 
                onClick={() => setCurrentPage('home')}
                className={`hover:text-blue-200 transition-colors ${currentPage === 'home' ? 'text-blue-200' : ''}`}
              >
                {t.home}
              </a>
            )}
            
            {user && (
              <a 
                href="#" 
                onClick={() => setCurrentPage('dashboard')}
                className={`hover:text-blue-200 transition-colors ${currentPage === 'dashboard' ? 'text-blue-200' : ''}`}
              >
                {t.dashboard}
              </a>
            )}
            
            <a 
              href="#" 
              onClick={() => setCurrentPage('schools')}
              className={`hover:text-blue-200 transition-colors ${currentPage === 'schools' ? 'text-blue-200' : ''}`}
            >
              {t.schools}
            </a>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-blue-200">
                  {user.first_name} {user.last_name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded transition-colors"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                  className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded transition-colors"
                >
                  {t.login}
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition-colors"
                >
                  {t.register}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  // Home Page Component
  const renderHomePage = () => (
    <div className="max-w-6xl mx-auto px-4 pt-20">
      {/* Hero Section */}
      <div className="text-center py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t.heroTitle}
        </h1>
        <p className="text-xl mb-8 max-w-3xl mx-auto">
          {t.heroSubtitle}
        </p>
        
        <div className="max-w-md mx-auto mb-8">
          <div className="flex">
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="flex-1 px-4 py-3 text-gray-800 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.selectState}</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <button
              onClick={() => setCurrentPage('schools')}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-r-lg transition duration-200"
            >
              Search
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setCurrentPage('schools')}
          className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition duration-200"
        >
          {t.getStarted}
        </button>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">{t.featureTitle1}</h3>
          <p className="text-gray-600">
            {t.featureDesc1}
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">🚗</div>
          <h3 className="text-xl font-semibold mb-2">{t.featureTitle2}</h3>
          <p className="text-gray-600">
            {t.featureDesc2}
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="text-xl font-semibold mb-2">{t.featureTitle3}</h3>
          <p className="text-gray-600">
            {t.featureDesc3}
          </p>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-12">
        <h2 className="text-2xl font-bold text-center mb-8">{t.featureTitle4}</h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              1
            </div>
            <h4 className="font-semibold mb-2">Choose State</h4>
            <p className="text-sm text-gray-600">
              Select your state from 58 Algerian wilayas
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              2
            </div>
            <h4 className="font-semibold mb-2">Browse Schools</h4>
            <p className="text-sm text-gray-600">
              Compare prices, ratings, and teacher information
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              3
            </div>
            <h4 className="font-semibold mb-2">Register & Pay</h4>
            <p className="text-sm text-gray-600">
              Complete your profile and make payment
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              4
            </div>
            <h4 className="font-semibold mb-2">Start Learning</h4>
            <p className="text-sm text-gray-600">
              Begin your journey to get your driving license
            </p>
          </div>
        </div>
      </div>

      {/* Partner Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg p-8 mb-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">{t.partnerTitle}</h2>
          <p className="text-xl mb-6">{t.partnerSubtitle}</p>
          <p className="mb-8 max-w-3xl mx-auto">{t.partnerDesc}</p>
          <button
            onClick={() => {
              if (user) {
                setShowSchoolRegistrationModal(true);
              } else {
                setAuthMode('register');
                setShowAuthModal(true);
              }
            }}
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition duration-200"
          >
            {t.registerSchool}
          </button>
        </div>
      </div>
    </div>
  );

  // Schools Page Component
  const renderSchoolsPage = () => (
    <div className="max-w-6xl mx-auto px-4 pt-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{t.findSchools}</h1>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.selectState}</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <button
              onClick={clearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="number"
              placeholder="Min Price"
              value={filters.min_price}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={filters.max_price}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Min Rating"
              value={filters.min_rating}
              min="1"
              max="5"
              onChange={(e) => handleFilterChange('min_rating', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schools Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {drivingSchools.map((school) => (
              <div key={school.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{school.name}</h3>
                      <p className="text-gray-600 text-sm flex items-center">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {school.address}, {school.state}
                      </p>
                    </div>
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                      {school.price} DA
                    </div>
                  </div>
                  
                  {school.rating && (
                    <div className="flex items-center mb-3">
                      <div className="flex text-yellow-400 mr-2">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`fas fa-star ${i < Math.floor(school.rating) ? '' : 'text-gray-300'}`}></i>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({school.review_count || 0} reviews)</span>
                    </div>
                  )}
                  
                  <p className="text-gray-700 mb-4">{school.description}</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEnroll(school.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {t.enrollNow}
                    </button>
                    <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                      {t.viewDetails}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center space-x-2">
              <button
                disabled={!pagination.has_prev}
                onClick={() => handleFilterChange('page', pagination.current_page - 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-gray-200 rounded-lg">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <button
                disabled={!pagination.has_next}
                onClick={() => handleFilterChange('page', pagination.current_page + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Dashboard Page Component
  const renderDashboardPage = () => {
    if (!user) {
      setCurrentPage('home');
      return null;
    }

    return (
      <div className="max-w-6xl mx-auto px-4 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.first_name}!</h1>
          <p className="text-gray-600">Role: {user.role}</p>
        </div>

        {user.role === 'student' && (
          <StudentDashboard
            user={user}
            dashboardData={dashboardData}
            userDocuments={userDocuments}
            onDocumentUpload={(type) => {
              setUploadDocumentType(type);
              setDocumentUploadModal(true);
            }}
          />
        )}

        {user.role === 'teacher' && (
          <TeacherDashboard
            user={user}
            dashboardData={dashboardData}
          />
        )}

        {user.role === 'manager' && (
          <NewManagerDashboard
            user={user}
            dashboardData={dashboardData}
            userSchool={userSchool}
            onSchoolPhotoUpload={(type) => {
              setSchoolPhotoType(type);
              setShowSchoolPhotoModal(true);
            }}
          />
        )}
      </div>
    );
  };

  // Authentication Modal Component
  const renderAuthModal = () => {
    if (!showAuthModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {authMode === 'login' ? t.login : t.register}
          </h2>
          
          <form onSubmit={handleAuth}>
            {authMode === 'register' && (
              <>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder={t.firstName}
                    value={authData.first_name}
                    onChange={(e) => setAuthData({...authData, first_name: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t.lastName}
                    value={authData.last_name}
                    onChange={(e) => setAuthData({...authData, last_name: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <input
                  type="tel"
                  placeholder={t.phone}
                  value={authData.phone}
                  onChange={(e) => setAuthData({...authData, phone: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  required
                />
                
                <input
                  type="text"
                  placeholder={t.address}
                  value={authData.address}
                  onChange={(e) => setAuthData({...authData, address: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  required
                />
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="date"
                    placeholder={t.dateOfBirth}
                    value={authData.date_of_birth}
                    onChange={(e) => setAuthData({...authData, date_of_birth: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    value={authData.gender}
                    onChange={(e) => setAuthData({...authData, gender: e.target.value})}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                <select
                  value={authData.state}
                  onChange={(e) => setAuthData({...authData, state: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  required
                >
                  <option value="">{t.selectState}</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </>
            )}
            
            <input
              type="email"
              placeholder={t.email}
              value={authData.email}
              onChange={(e) => setAuthData({...authData, email: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            />
            
            <input
              type="password"
              placeholder={t.password}
              value={authData.password}
              onChange={(e) => setAuthData({...authData, password: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              required
            />
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-blue-300"
              >
                {loading ? 'Loading...' : (authMode === 'login' ? t.login : t.register)}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {authMode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // School Registration Modal Component
  const renderSchoolRegistrationModal = () => {
    if (!showSchoolRegistrationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6 text-center">{t.registerSchool}</h2>
          
          <form onSubmit={handleSchoolRegistration}>
            <input
              type="text"
              placeholder={t.schoolName}
              value={schoolData.name}
              onChange={(e) => setSchoolData({...schoolData, name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            />
            
            <input
              type="text"
              placeholder={t.address}
              value={schoolData.address}
              onChange={(e) => setSchoolData({...schoolData, address: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            />
            
            <select
              value={schoolData.state}
              onChange={(e) => setSchoolData({...schoolData, state: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            >
              <option value="">{t.selectState}</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            
            <input
              type="tel"
              placeholder={t.phone}
              value={schoolData.phone}
              onChange={(e) => setSchoolData({...schoolData, phone: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            />
            
            <input
              type="email"
              placeholder={t.email}
              value={schoolData.email}
              onChange={(e) => setSchoolData({...schoolData, email: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            />
            
            <textarea
              placeholder={t.schoolDescription}
              value={schoolData.description}
              onChange={(e) => setSchoolData({...schoolData, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows="3"
              required
            />
            
            <input
              type="number"
              placeholder={t.schoolPrice}
              value={schoolData.price}
              onChange={(e) => setSchoolData({...schoolData, price: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              required
            />
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowSchoolRegistrationModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-blue-300"
              >
                {loading ? 'Loading...' : t.registerSchoolBtn}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Main Render
  return (
    <div className="App min-h-screen bg-gray-50">
      {renderNavigation()}
      
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-40">
          <div className="flex items-center">
            <i className="fas fa-check-circle mr-2"></i>
            {successMessage}
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="fixed top-20 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-40">
          <div className="flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {errorMessage}
            <button 
              onClick={() => setErrorMessage('')}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Page Content */}
      {currentPage === 'home' && renderHomePage()}
      {currentPage === 'schools' && renderSchoolsPage()}
      {currentPage === 'dashboard' && renderDashboardPage()}

      {/* Modals */}
      {renderAuthModal()}
      {renderSchoolRegistrationModal()}
      
      {documentUploadModal && (
        <DocumentUpload
          documentType={uploadDocumentType}
          onSuccess={handleDocumentUploadSuccess}
          onCancel={handleDocumentUploadCancel}
        />
      )}
    </div>
  );
}

export default App;