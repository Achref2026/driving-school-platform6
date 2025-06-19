import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NewManagerDashboard = ({ user, token }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [schoolData, setSchoolData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [studentProgress, setStudentProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentDocuments, setStudentDocuments] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [refusalReason, setRefusalReason] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: 'male',
    password: '',
    can_teach_male: true,
    can_teach_female: true
  });

  const [sessionForm, setSessionForm] = useState({
    course_id: '',
    teacher_id: '',
    scheduled_at: '',
    duration_minutes: 60,
    location: ''
  });

  const [quizForm, setQuizForm] = useState({
    course_type: 'theory',
    title: '',
    description: '',
    difficulty: 'medium',
    passing_score: 70,
    time_limit_minutes: 30,
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: ''
  });

  useEffect(() => {
    fetchManagerData();
  }, [user]);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch school data
      const schoolResponse = await axios.get(`${API}/manager/school`, { headers });
      setSchoolData(schoolResponse.data);

      // Fetch enrollments
      const enrollmentsResponse = await axios.get(`${API}/manager/enrollments`, { headers });
      setEnrollments(enrollmentsResponse.data.enrollments || []);

      // Fetch teachers
      const teachersResponse = await axios.get(`${API}/manager/teachers`, { headers });
      setTeachers(teachersResponse.data.teachers || []);

      // Fetch sessions
      const sessionsResponse = await axios.get(`${API}/manager/sessions`, { headers });
      setSessions(sessionsResponse.data.sessions || []);

      // Fetch quizzes
      const quizzesResponse = await axios.get(`${API}/manager/quizzes`, { headers });
      setQuizzes(quizzesResponse.data.quizzes || []);

      // Fetch analytics
      const analyticsResponse = await axios.get(`${API}/manager/analytics/overview`, { headers });
      setAnalytics(analyticsResponse.data);

      // Fetch student progress
      const progressResponse = await axios.get(`${API}/manager/students/progress`, { headers });
      setStudentProgress(progressResponse.data.student_progress || []);

    } catch (error) {
      console.error('Error fetching manager data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Student Management Functions
  const handleViewStudentDetails = async (enrollment) => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API}/manager/student-details/${enrollment.student_id}`, { headers });
      setStudentDetails(response.data);
      setSelectedStudent(enrollment);
      setShowStudentModal(true);
    } catch (error) {
      console.error('Error fetching student details:', error);
      alert('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocuments = async (enrollment) => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API}/manager/enrollments/${enrollment.id}/documents`, { headers });
      setStudentDocuments(response.data);
      setSelectedStudent(enrollment);
      setShowDocumentsModal(true);
    } catch (error) {
      console.error('Error fetching student documents:', error);
      alert('Failed to load student documents');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptStudent = async (enrollment) => {
    if (!confirm(`Are you sure you want to accept ${enrollment.student_name}? They will become officially enrolled and their role will change to student.`)) {
      return;
    }

    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post(`${API}/manager/enrollments/${enrollment.id}/accept`, {}, { headers });
      
      // Update enrollment status in the list
      setEnrollments(prev => 
        prev.map(e => 
          e.id === enrollment.id 
            ? { ...e, enrollment_status: 'approved' }
            : e
        )
      );
      
      alert(`✅ ${enrollment.student_name} has been accepted! They are now a student and can start lessons.`);
      await fetchManagerData(); // Refresh all data
    } catch (error) {
      console.error('Error accepting student:', error);
      alert('Failed to accept student');
    } finally {
      setLoading(false);
    }
  };

  const handleRefuseStudent = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setRefusalReason('');
    setShowRefuseModal(true);
  };

  const handleSubmitRefusal = async () => {
    if (!refusalReason.trim()) {
      alert('Please provide a reason for refusal');
      return;
    }

    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const formData = new FormData();
      formData.append('reason', refusalReason);
      
      await axios.post(`${API}/manager/enrollments/${selectedEnrollment.id}/refuse`, formData, { headers });
      
      setEnrollments(prev => 
        prev.map(e => 
          e.id === selectedEnrollment.id 
            ? { ...e, enrollment_status: 'rejected' }
            : e
        )
      );
      
      setShowRefuseModal(false);
      setSelectedEnrollment(null);
      setRefusalReason('');
      
      alert(`❌ ${selectedEnrollment.student_name} has been refused. They will be notified with the reason.`);
    } catch (error) {
      console.error('Error refusing student:', error);
      alert('Failed to refuse student');
    } finally {
      setLoading(false);
    }
  };

  // Teacher Management Functions
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    
    if (!teacherForm.password || teacherForm.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/manager/teachers`, teacherForm, { headers });
      
      if (response.data.teacher) {
        setTeachers(prev => [...prev, response.data.teacher]);
      }
      
      setShowTeacherModal(false);
      setTeacherForm({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        date_of_birth: '',
        gender: 'male',
        password: '',
        can_teach_male: true,
        can_teach_female: true
      });
      
      alert(`Teacher added successfully! Teacher can login with email: ${teacherForm.email}`);
    } catch (error) {
      console.error('Error adding teacher:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to add teacher';
      alert(errorMessage);
    }
  };

  const handleRemoveTeacher = async (teacherId) => {
    if (!window.confirm('Are you sure you want to remove this teacher?')) return;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API}/manager/teachers/${teacherId}`, { headers });
      
      setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
      alert('Teacher removed successfully');
    } catch (error) {
      console.error('Error removing teacher:', error);
      alert('Failed to remove teacher');
    }
  };

  // Session Management Functions
  const handleScheduleSession = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/manager/sessions`, sessionForm, { headers });
      
      setSessions(prev => [...prev, response.data.session]);
      setShowSessionModal(false);
      setSessionForm({
        course_id: '',
        teacher_id: '',
        scheduled_at: '',
        duration_minutes: 60,
        location: ''
      });
      
      alert('Session scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling session:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to schedule session';
      alert(errorMessage);
    }
  };

  // Quiz Management Functions
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/manager/quizzes`, quizForm, { headers });
      
      setQuizzes(prev => [...prev, response.data.quiz]);
      setShowQuizModal(false);
      setQuizForm({
        course_type: 'theory',
        title: '',
        description: '',
        difficulty: 'medium',
        passing_score: 70,
        time_limit_minutes: 30,
        questions: []
      });
      
      alert('Quiz created successfully!');
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz');
    }
  };

  const addQuestionToQuiz = () => {
    if (!currentQuestion.question || currentQuestion.options.some(opt => !opt)) {
      alert('Please fill all question fields');
      return;
    }

    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion }]
    }));

    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: ''
    });
  };

  const removeQuestionFromQuiz = (index) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  // Utility Functions
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending_documents':
        return 'bg-warning text-dark';
      case 'pending_approval':
        return 'bg-info text-white';
      case 'approved':
        return 'bg-success text-white';
      case 'rejected':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  };

  const getDocumentIcon = (docType) => {
    switch (docType) {
      case 'profile_photo':
        return 'fas fa-user-circle';
      case 'id_card':
        return 'fas fa-id-card';
      case 'medical_certificate':
        return 'fas fa-notes-medical';
      case 'residence_certificate':
        return 'fas fa-home';
      default:
        return 'fas fa-file';
    }
  };

  const getDocumentName = (docType) => {
    const names = {
      profile_photo: 'Profile Photo',
      id_card: 'ID Card',
      medical_certificate: 'Medical Certificate',
      residence_certificate: 'Residence Certificate'
    };
    return names[docType] || docType.replace('_', ' ').toUpperCase();
  };

  if (loading && !schoolData) {
    return (
      <div className="manager-dashboard-loading text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4">
        <h4>Error Loading Dashboard</h4>
        <p>{error}</p>
        <button onClick={fetchManagerData} className="btn btn-outline-danger">
          Try Again
        </button>
      </div>
    );
  }

  const pendingApprovals = enrollments.filter(e => e.enrollment_status === 'pending_approval');
  const approvedStudents = enrollments.filter(e => e.enrollment_status === 'approved');

  return (
    <div className="manager-dashboard pt-5 mt-5">
      <div className="container-fluid">
        {/* Header */}
        <div className="dashboard-header mb-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-5 fw-bold mb-2">
                🏫 Manager Dashboard
              </h1>
              <p className="lead text-muted">
                {schoolData?.name || 'Driving School'} - Complete management platform
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <div className="dashboard-stats">
                <div className="stat-item">
                  <div className="stat-number display-6 fw-bold text-warning">
                    {pendingApprovals.length}
                  </div>
                  <div className="stat-label text-muted">Pending Approvals</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <ul className="nav nav-pills mb-4 bg-light p-2 rounded">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fas fa-chart-line me-2"></i>Overview
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <i className="fas fa-users me-2"></i>Students ({enrollments.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              <i className="fas fa-chalkboard-teacher me-2"></i>Teachers ({teachers.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              <i className="fas fa-calendar me-2"></i>Sessions ({sessions.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'quizzes' ? 'active' : ''}`}
              onClick={() => setActiveTab('quizzes')}
            >
              <i className="fas fa-question-circle me-2"></i>Quizzes ({quizzes.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('progress')}
            >
              <i className="fas fa-chart-bar me-2"></i>Progress
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <i className="fas fa-analytics me-2"></i>Analytics
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="row g-4">
            {/* Quick Stats Cards */}
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="icon-circle bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    <i className="fas fa-users fa-2x"></i>
                  </div>
                  <h3 className="fw-bold">{enrollments.length}</h3>
                  <p className="text-muted mb-0">Total Students</p>
                </div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="icon-circle bg-warning bg-opacity-10 text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    <i className="fas fa-clock fa-2x"></i>
                  </div>
                  <h3 className="fw-bold">{pendingApprovals.length}</h3>
                  <p className="text-muted mb-0">Pending Approval</p>
                </div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="icon-circle bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    <i className="fas fa-check-circle fa-2x"></i>
                  </div>
                  <h3 className="fw-bold">{approvedStudents.length}</h3>
                  <p className="text-muted mb-0">Approved Students</p>
                </div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="icon-circle bg-info bg-opacity-10 text-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    <i className="fas fa-chalkboard-teacher fa-2x"></i>
                  </div>
                  <h3 className="fw-bold">{teachers.length}</h3>
                  <p className="text-muted mb-0">Teachers</p>
                </div>
              </div>
            </div>

            {/* Pending Approvals Alert */}
            {pendingApprovals.length > 0 && (
              <div className="col-12">
                <div className="alert alert-warning d-flex align-items-center" role="alert">
                  <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
                  <div className="flex-grow-1">
                    <h5 className="alert-heading mb-1">⚠️ Action Required!</h5>
                    <p className="mb-0">
                      You have <strong>{pendingApprovals.length}</strong> student(s) waiting for approval. 
                      Review their documents and decide to accept or refuse their enrollment.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('students')}
                    className="btn btn-warning"
                  >
                    <i className="fas fa-eye me-2"></i>
                    Review Now
                  </button>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Recent Student Enrollments</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Enrolled</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.slice(0, 5).map((enrollment) => (
                          <tr key={enrollment.id}>
                            <td>{enrollment.student_name}</td>
                            <td>{enrollment.student_email}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(enrollment.enrollment_status)}`}>
                                {enrollment.enrollment_status?.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td>{new Date(enrollment.created_at).toLocaleDateString()}</td>
                            <td>
                              {enrollment.enrollment_status === 'pending_approval' && (
                                <div className="btn-group btn-group-sm">
                                  <button
                                    onClick={() => handleAcceptStudent(enrollment)}
                                    className="btn btn-success"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRefuseStudent(enrollment)}
                                    className="btn btn-danger"
                                  >
                                    Refuse
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h3 className="card-title fw-bold mb-0">
                <i className="fas fa-user-graduate me-2"></i>
                Student Enrollment Management
              </h3>
              <p className="text-muted mb-0 mt-2">Review documents and manage student enrollments</p>
            </div>
            <div className="card-body">
              {enrollments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Student</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Enrolled Date</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar bg-primary text-white rounded-circle me-3 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                {enrollment.student_name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <div className="fw-bold">{enrollment.student_name}</div>
                                <div className="small text-muted">ID: {enrollment.student_id.slice(-8)}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="small">
                              <div><i className="fas fa-envelope me-1"></i> {enrollment.student_email}</div>
                              {enrollment.student_phone && (
                                <div><i className="fas fa-phone me-1"></i> {enrollment.student_phone}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(enrollment.enrollment_status)}`}>
                              {enrollment.enrollment_status?.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>{new Date(enrollment.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center">
                              <button
                                onClick={() => handleViewStudentDetails(enrollment)}
                                className="btn btn-outline-info btn-sm"
                                title="View student details"
                                disabled={loading}
                              >
                                <i className="fas fa-user"></i>
                              </button>

                              <button
                                onClick={() => handleViewDocuments(enrollment)}
                                className="btn btn-outline-secondary btn-sm"
                                title="View uploaded documents"
                                disabled={loading}
                              >
                                <i className="fas fa-file-alt"></i>
                              </button>

                              {enrollment.enrollment_status === 'pending_approval' && (
                                <>
                                  <button
                                    onClick={() => handleAcceptStudent(enrollment)}
                                    className="btn btn-success btn-sm"
                                    title="Accept this student"
                                    disabled={loading}
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button
                                    onClick={() => handleRefuseStudent(enrollment)}
                                    className="btn btn-danger btn-sm"
                                    title="Refuse this student"
                                    disabled={loading}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </>
                              )}

                              {enrollment.enrollment_status === 'approved' && (
                                <span className="badge bg-success">
                                  ✅ Accepted
                                </span>
                              )}

                              {enrollment.enrollment_status === 'rejected' && (
                                <span className="badge bg-danger">
                                  ❌ Refused
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-user-graduate fa-4x text-muted mb-4"></i>
                  <h5 className="fw-bold mb-3">No students enrolled yet</h5>
                  <p className="text-muted">Students will appear here when they enroll in your driving school.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">School Teachers</h5>
              <button
                onClick={() => setShowTeacherModal(true)}
                className="btn btn-primary"
              >
                <i className="fas fa-user-plus me-2"></i>Add Teacher
              </button>
            </div>
            <div className="card-body">
              <div className="row g-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="col-md-6 col-lg-4">
                    <div className="card h-100">
                      <div className="card-body text-center">
                        <div className="avatar bg-info text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                          {teacher.user_details?.first_name?.charAt(0) || 'T'}
                        </div>
                        <h6 className="card-title">{teacher.user_details ? `${teacher.user_details.first_name} ${teacher.user_details.last_name}` : 'Unknown Teacher'}</h6>
                        <p className="text-muted small mb-2">{teacher.user_details?.email || 'No email'}</p>
                        
                        <div className="mb-3">
                          <div className="d-flex justify-content-center gap-2 mb-2">
                            {teacher.can_teach_male && (
                              <span className="badge bg-primary">♂ Male Students</span>
                            )}
                            {teacher.can_teach_female && (
                              <span className="badge bg-pink text-white" style={{backgroundColor: '#e91e63'}}>♀ Female Students</span>
                            )}
                          </div>
                          <div className="small text-muted">
                            Rating: {teacher.rating || 0}/5 ({teacher.total_reviews || 0} reviews)
                          </div>
                        </div>
                        
                        <div className="d-grid gap-2">
                          <button
                            onClick={() => handleRemoveTeacher(teacher.id)}
                            className="btn btn-outline-danger btn-sm"
                          >
                            <i className="fas fa-user-minus me-2"></i>Remove Teacher
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {teachers.length === 0 && (
                  <div className="col-12">
                    <div className="text-center py-5">
                      <i className="fas fa-chalkboard-teacher fa-4x text-muted mb-4"></i>
                      <h5>No Teachers Added</h5>
                      <p className="text-muted">Add teachers to your driving school to start teaching students</p>
                      <button
                        onClick={() => setShowTeacherModal(true)}
                        className="btn btn-primary"
                      >
                        <i className="fas fa-user-plus me-2"></i>Add First Teacher
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">All Sessions</h5>
              <button
                onClick={() => setShowSessionModal(true)}
                className="btn btn-primary"
              >
                <i className="fas fa-calendar-plus me-2"></i>Schedule New Session
              </button>
            </div>
            <div className="card-body">
              {sessions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Teacher</th>
                        <th>Session Type</th>
                        <th>Date & Time</th>
                        <th>Duration</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.id}>
                          <td>{session.student_name || 'Student'}</td>
                          <td>{session.teacher_name || 'Teacher'}</td>
                          <td>
                            <span className={`badge ${session.session_type === 'theory' ? 'bg-info' : session.session_type === 'park' ? 'bg-warning' : 'bg-success'}`}>
                              {session.session_type?.toUpperCase()}
                            </span>
                          </td>
                          <td>{new Date(session.scheduled_at).toLocaleString()}</td>
                          <td>{session.duration_minutes} min</td>
                          <td>{session.location || 'N/A'}</td>
                          <td>
                            <span className={`badge ${session.status === 'completed' ? 'bg-success' : session.status === 'in_progress' ? 'bg-warning' : 'bg-secondary'}`}>
                              {session.status?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-calendar fa-4x text-muted mb-4"></i>
                  <h5>No Sessions Scheduled</h5>
                  <p className="text-muted">Schedule sessions for your students to start their lessons</p>
                  <button
                    onClick={() => setShowSessionModal(true)}
                    className="btn btn-primary"
                  >
                    <i className="fas fa-calendar-plus me-2"></i>Schedule First Session
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">School Quizzes</h5>
              <button
                onClick={() => setShowQuizModal(true)}
                className="btn btn-success"
              >
                <i className="fas fa-plus me-2"></i>Create Quiz
              </button>
            </div>
            <div className="card-body">
              {quizzes.length > 0 ? (
                <div className="row g-4">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="col-md-6 col-lg-4">
                      <div className="card h-100">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <span className={`badge ${quiz.course_type === 'theory' ? 'bg-info' : quiz.course_type === 'park' ? 'bg-warning' : 'bg-success'}`}>
                              {quiz.course_type?.toUpperCase()}
                            </span>
                            <span className={`badge ${quiz.difficulty === 'easy' ? 'bg-success' : quiz.difficulty === 'medium' ? 'bg-warning' : 'bg-danger'}`}>
                              {quiz.difficulty?.toUpperCase()}
                            </span>
                          </div>
                          <h6 className="card-title">{quiz.title}</h6>
                          <p className="card-text small text-muted">{quiz.description}</p>
                          <div className="small text-muted mb-3">
                            <div>Questions: {quiz.questions?.length || 0}</div>
                            <div>Passing Score: {quiz.passing_score}%</div>
                            <div>Time Limit: {quiz.time_limit_minutes} min</div>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-outline-primary btn-sm flex-fill">
                              <i className="fas fa-eye me-1"></i>View
                            </button>
                            <button className="btn btn-outline-secondary btn-sm flex-fill">
                              <i className="fas fa-edit me-1"></i>Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-question-circle fa-4x text-muted mb-4"></i>
                  <h5>No Quizzes Created</h5>
                  <p className="text-muted">Create quizzes to test your students' knowledge</p>
                  <button
                    onClick={() => setShowQuizModal(true)}
                    className="btn btn-success"
                  >
                    <i className="fas fa-plus me-2"></i>Create First Quiz
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Student Progress Overview</h5>
            </div>
            <div className="card-body">
              {studentProgress.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Enrollment Date</th>
                        <th>Progress</th>
                        <th>Courses</th>
                        <th>Quiz Performance</th>
                        <th>Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentProgress.map((student) => (
                        <tr key={student.student_id}>
                          <td>
                            <div>
                              <div className="fw-bold">{student.student_name}</div>
                              <div className="small text-muted">{student.student_email}</div>
                            </div>
                          </td>
                          <td>{new Date(student.enrollment_date).toLocaleDateString()}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress me-2" style={{width: '100px', height: '8px'}}>
                                <div
                                  className="progress-bar bg-primary"
                                  style={{width: `${student.progress_percentage}%`}}
                                ></div>
                              </div>
                              <span className="small">{student.progress_percentage}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="small">{student.courses_status.completed}/{student.courses_status.total}</span>
                          </td>
                          <td>
                            <div className="small">
                              <div>Attempts: {student.quiz_performance.total_attempts}</div>
                              <div>Avg Score: {student.quiz_performance.average_score}%</div>
                            </div>
                          </td>
                          <td>
                            <span className="small">{student.sessions.completed}/{student.sessions.total}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-chart-line fa-4x text-muted mb-4"></i>
                  <h5>No Progress Data</h5>
                  <p className="text-muted">Student progress will appear here once they start their courses</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title mb-0">School Overview</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="metric">
                        <div className="metric-value h4 mb-0">{analytics.overview_metrics?.total_enrollments || 0}</div>
                        <div className="metric-label text-muted">Total Enrollments</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="metric">
                        <div className="metric-value h4 mb-0">{analytics.overview_metrics?.approved_enrollments || 0}</div>
                        <div className="metric-label text-muted">Approved</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="metric">
                        <div className="metric-value h4 mb-0">{analytics.overview_metrics?.total_teachers || 0}</div>
                        <div className="metric-label text-muted">Teachers</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="metric">
                        <div className="metric-value h4 mb-0">{analytics.overview_metrics?.completed_sessions || 0}</div>
                        <div className="metric-label text-muted">Sessions Done</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title mb-0">Revenue & Rating</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="metric">
                        <div className="metric-value h4 mb-0">{analytics.overview_metrics?.estimated_revenue?.toLocaleString() || 0} DA</div>
                        <div className="metric-label text-muted">Estimated Revenue</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="metric">
                        <div className="metric-value h4 mb-0">{analytics.school_rating || 0}/5</div>
                        <div className="metric-label text-muted">School Rating</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="metric">
                        <div className="metric-value h4 mb-0">{analytics.total_reviews || 0}</div>
                        <div className="metric-label text-muted">Total Reviews</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      
      {/* Add Teacher Modal */}
      {showTeacherModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Teacher</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowTeacherModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddTeacher}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={teacherForm.email}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        value={teacherForm.password}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, password: e.target.value }))}
                        minLength="6"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={teacherForm.first_name}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, first_name: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={teacherForm.last_name}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, last_name: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={teacherForm.phone}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-select"
                        value={teacherForm.gender}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, gender: e.target.value }))}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={teacherForm.address}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={teacherForm.date_of_birth}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Teaching Permissions</label>
                      <div className="d-flex gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={teacherForm.can_teach_male}
                            onChange={(e) => setTeacherForm(prev => ({ ...prev, can_teach_male: e.target.checked }))}
                          />
                          <label className="form-check-label">Can teach male students</label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={teacherForm.can_teach_female}
                            onChange={(e) => setTeacherForm(prev => ({ ...prev, can_teach_female: e.target.checked }))}
                          />
                          <label className="form-check-label">Can teach female students</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowTeacherModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showQuizModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Quiz</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowQuizModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateQuiz}>
                <div className="modal-body">
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Quiz Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={quizForm.title}
                        onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Course Type *</label>
                      <select
                        className="form-select"
                        value={quizForm.course_type}
                        onChange={(e) => setQuizForm(prev => ({ ...prev, course_type: e.target.value }))}
                        required
                      >
                        <option value="theory">Theory</option>
                        <option value="park">Park</option>
                        <option value="road">Road</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={quizForm.description}
                        onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Difficulty</label>
                      <select
                        className="form-select"
                        value={quizForm.difficulty}
                        onChange={(e) => setQuizForm(prev => ({ ...prev, difficulty: e.target.value }))}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Passing Score (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max="100"
                        value={quizForm.passing_score}
                        onChange={(e) => setQuizForm(prev => ({ ...prev, passing_score: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Time Limit (minutes)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={quizForm.time_limit_minutes}
                        onChange={(e) => setQuizForm(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  {/* Questions Section */}
                  <div className="border rounded p-3 mb-3">
                    <h6 className="fw-bold mb-3">Add Question</h6>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Question *</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={currentQuestion.question}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                          placeholder="Enter your question here..."
                        />
                      </div>
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="col-md-6">
                          <label className="form-label">Option {index + 1} *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...currentQuestion.options];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            placeholder={`Option ${index + 1}`}
                          />
                        </div>
                      ))}
                      <div className="col-md-6">
                        <label className="form-label">Correct Answer</label>
                        <select
                          className="form-select"
                          value={currentQuestion.correct_answer}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correct_answer: parseInt(e.target.value) }))}
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                          <option value={3}>Option 4</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Explanation (Optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={currentQuestion.explanation}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                          placeholder="Explain why this is correct..."
                        />
                      </div>
                      <div className="col-12">
                        <button
                          type="button"
                          onClick={addQuestionToQuiz}
                          className="btn btn-outline-primary"
                        >
                          <i className="fas fa-plus me-2"></i>Add Question
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Questions List */}
                  {quizForm.questions.length > 0 && (
                    <div>
                      <h6 className="fw-bold mb-3">Quiz Questions ({quizForm.questions.length})</h6>
                      {quizForm.questions.map((question, index) => (
                        <div key={index} className="card mb-2">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="fw-bold">Q{index + 1}: {question.question}</h6>
                                <div className="small text-muted">
                                  Correct Answer: {question.options[question.correct_answer]}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeQuestionFromQuiz(index)}
                                className="btn btn-outline-danger btn-sm"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowQuizModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={quizForm.questions.length === 0}
                  >
                    Create Quiz
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentModal && studentDetails && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user me-2"></i>
                  Student Details
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowStudentModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">Personal Information</h6>
                    <div className="info-group">
                      <div className="info-item mb-2">
                        <strong>Name:</strong> {studentDetails.student.first_name} {studentDetails.student.last_name}
                      </div>
                      <div className="info-item mb-2">
                        <strong>Email:</strong> {studentDetails.student.email}
                      </div>
                      <div className="info-item mb-2">
                        <strong>Phone:</strong> {studentDetails.student.phone || 'N/A'}
                      </div>
                      <div className="info-item mb-2">
                        <strong>Address:</strong> {studentDetails.student.address || 'N/A'}
                      </div>
                      <div className="info-item mb-2">
                        <strong>Date of Birth:</strong> {studentDetails.student.date_of_birth || 'N/A'}
                      </div>
                      <div className="info-item mb-2">
                        <strong>Gender:</strong> {studentDetails.student.gender || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">Enrollment Information</h6>
                    <div className="info-group">
                      <div className="info-item mb-2">
                        <strong>Status:</strong> 
                        <span className={`badge ms-2 ${getStatusBadgeClass(studentDetails.enrollment.enrollment_status)}`}>
                          {studentDetails.enrollment.enrollment_status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="info-item mb-2">
                        <strong>Enrolled:</strong> {new Date(studentDetails.enrollment.created_at).toLocaleDateString()}
                      </div>
                      {studentDetails.enrollment.approved_at && (
                        <div className="info-item mb-2">
                          <strong>Approved:</strong> {new Date(studentDetails.enrollment.approved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <h6 className="fw-bold text-primary mb-3 mt-4">Document Status</h6>
                    <div className="documents-summary">
                      {Object.entries(studentDetails.documents).map(([docType, docInfo]) => (
                        <div key={docType} className="d-flex justify-content-between align-items-center mb-2">
                          <span>{getDocumentName(docType)}</span>
                          <span className={`badge ${docInfo.status === 'accepted' ? 'bg-success' : docInfo.status === 'pending' ? 'bg-warning text-dark' : docInfo.status === 'not_uploaded' ? 'bg-secondary' : 'bg-danger'}`}>
                            {docInfo.status === 'not_uploaded' ? 'Not Uploaded' : docInfo.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowStudentModal(false)}
                >
                  Close
                </button>
                {selectedStudent?.enrollment_status === 'pending_approval' && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-success" 
                      onClick={() => {
                        setShowStudentModal(false);
                        handleAcceptStudent(selectedStudent);
                      }}
                    >
                      <i className="fas fa-check me-2"></i>
                      Accept Student
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => {
                        setShowStudentModal(false);
                        handleRefuseStudent(selectedStudent);
                      }}
                    >
                      <i className="fas fa-times me-2"></i>
                      Refuse Student
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && studentDocuments && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-file-alt me-2"></i>
                  Student Documents - {studentDocuments.student_info.name}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDocumentsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  {studentDocuments.documents.map((document) => (
                    <div key={document.id} className="col-md-6">
                      <div className="card border">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <i className={`${getDocumentIcon(document.document_type)} me-2 text-primary`}></i>
                            <strong>{getDocumentName(document.document_type)}</strong>
                          </div>
                          <span className={`badge ${document.status === 'accepted' ? 'bg-success' : document.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                            {document.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="card-body">
                          <div className="document-info mb-3">
                            <div className="small text-muted mb-1">
                              <strong>File:</strong> {document.file_name}
                            </div>
                            <div className="small text-muted mb-1">
                              <strong>Uploaded:</strong> {new Date(document.upload_date).toLocaleDateString()}
                            </div>
                            <div className="small text-muted mb-1">
                              <strong>Size:</strong> {(document.file_size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>

                          {document.refusal_reason && (
                            <div className="alert alert-danger py-2">
                              <small><strong>Refusal Reason:</strong> {document.refusal_reason}</small>
                            </div>
                          )}

                          <div className="d-flex gap-2">
                            <a
                              href={document.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-primary btn-sm flex-fill"
                            >
                              <i className="fas fa-eye me-1"></i>
                              View Document
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {studentDocuments.documents.length === 0 && (
                  <div className="text-center py-5">
                    <i className="fas fa-file-upload fa-4x text-muted mb-3"></i>
                    <h5 className="text-muted">No documents uploaded yet</h5>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDocumentsModal(false)}
                >
                  Close
                </button>
                {selectedStudent?.enrollment_status === 'pending_approval' && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-success" 
                      onClick={() => {
                        setShowDocumentsModal(false);
                        handleAcceptStudent(selectedStudent);
                      }}
                    >
                      <i className="fas fa-check me-2"></i>
                      Accept Student
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => {
                        setShowDocumentsModal(false);
                        handleRefuseStudent(selectedStudent);
                      }}
                    >
                      <i className="fas fa-times me-2"></i>
                      Refuse Student
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refuse Modal */}
      {showRefuseModal && selectedEnrollment && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <i className="fas fa-times-circle me-2"></i>
                  Refuse Student Enrollment
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowRefuseModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>You are about to refuse {selectedEnrollment.student_name}'s enrollment.</strong>
                  <br />
                  <small>The student will be notified with your reason. They can reapply later.</small>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Reason for refusal <span className="text-danger">*</span></strong>
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={refusalReason}
                    onChange={(e) => setRefusalReason(e.target.value)}
                    placeholder="Please provide a clear reason why this enrollment is being refused..."
                    required
                  />
                  <div className="form-text">
                    This reason will be shown to the student. Be professional and specific.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowRefuseModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleSubmitRefusal}
                  disabled={!refusalReason.trim() || loading}
                >
                  <i className="fas fa-times me-2"></i>
                  Refuse Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewManagerDashboard;