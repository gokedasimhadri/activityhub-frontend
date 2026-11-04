import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { errMsg } from '../api';
import { useMeta } from '../meta.js';

const forms = [
  ['2.6', 'Workshops organized', '#2b4fd8'],
  ['2.7', 'Guest lectures', '#0f9d8a'],
  ['2.10', 'Industrial visits', '#0369a1'],
  ['5.4', 'Extension & outreach', '#15803d'],
  ['5.5', 'Student clubs', '#ea580c'],
  ['6.2', 'Entrepreneurship events', '#be123c']
];

export default function Login() {
  const { login, register, studentRegister } = useAuth();
  const meta = useMeta();

  // 'student-login' | 'student-register' | 'faculty-login' | 'faculty-register'
  const [userType, setUserType] = useState('student'); // 'student' | 'faculty'
  const [isRegister, setIsRegister] = useState(false);

  const [f, setF] = useState({
    name: '',
    email: '',
    rollNumber: '',
    password: '',
    department: 'CSE'
  });
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      if (userType === 'student') {
        if (isRegister) {
          await studentRegister({
            name: f.name,
            email: f.email,
            rollNumber: f.rollNumber,
            password: f.password,
            department: f.department
          });
        } else {
          // Log in with email or rollNumber
          await login(f.email || f.rollNumber, f.password);
        }
      } else {
        if (isRegister) {
          await register(f);
        } else {
          await login(f.email, f.password);
        }
      }
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleTab = (type) => {
    setUserType(type);
    setIsRegister(false);
    setErr('');
  };

  return (
    <div className="login">
      <section className="hero">
        <h1>Every workshop, lecture and visit, recorded once.</h1>
        <p>Students can discover upcoming department activities, register instantly, and manage participations.</p>
        <ul className="formlist">
          {forms.map(([n, t, c]) => (
            <li key={n} style={{ '--c': c }}>
              <b>Form {n}</b>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <form onSubmit={submit} className="loginform">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn ${userType === 'student' ? 'primary' : 'ghost'}`}
              style={{ flex: 1, padding: '0.5rem' }}
              onClick={() => handleRoleTab('student')}
            >
              🎓 Student
            </button>
            <button
              type="button"
              className={`btn ${userType === 'faculty' ? 'primary' : 'ghost'}`}
              style={{ flex: 1, padding: '0.5rem' }}
              onClick={() => handleRoleTab('faculty')}
            >
              👨‍🏫 Faculty / Staff
            </button>
          </div>

          <h2>
            {userType === 'student'
              ? (isRegister ? 'Student Registration' : 'Student Log In')
              : (isRegister ? 'Create Faculty Account' : 'Faculty / Staff Log In')}
          </h2>

          {isRegister && (
            <label>
              Full Name
              <input required value={f.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" />
            </label>
          )}

          {userType === 'student' && isRegister && (
            <label>
              Roll Number / Student ID
              <input
                required
                value={f.rollNumber}
                onChange={set('rollNumber')}
                placeholder="e.g. 22A91A0501"
                style={{ textTransform: 'uppercase' }}
              />
            </label>
          )}

          <label>
            {userType === 'student' && !isRegister ? 'Email or Roll Number' : 'University Email'}
            <input
              type={userType === 'student' && !isRegister ? 'text' : 'email'}
              required
              value={f.email}
              onChange={set('email')}
              placeholder={userType === 'student' && !isRegister ? '22A91A0501 or student@aditya.edu' : 'name@aditya.edu'}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={f.password}
              onChange={set('password')}
              placeholder="••••••••"
            />
          </label>

          {isRegister && (
            <label>
              Department
              <select value={f.department} onChange={set('department')}>
                {(meta?.departments || ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MCA', 'MBA']).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
          )}

          {err && <div className="alert err">{err}</div>}

          <button className="btn primary wide" disabled={submitting}>
            {submitting ? 'Please wait…' : (isRegister ? 'Create Account' : 'Log In')}
          </button>

          <button
            type="button"
            className="linkbtn"
            onClick={() => { setIsRegister(!isRegister); setErr(''); }}
          >
            {isRegister
              ? 'Already registered? Log in here'
              : (userType === 'student' ? 'New student? Register your account' : 'New faculty? Create an account')}
          </button>

          {/* Demo account quick buttons */}
          <div className="demo" style={{ marginTop: '1rem' }}>
            <small>Quick Demo Accounts (password: <code>password123</code> or <code>Aditya@123</code>)</small>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => { setUserType('student'); setIsRegister(false); setF({ ...f, email: '23MH1A0563', password: 'password123' }); }}
              >
                🎓 Student (23MH1A0563)
              </button>
              <button
                type="button"
                onClick={() => { setUserType('student'); setIsRegister(false); setF({ ...f, email: '22A91A0501', password: 'password123' }); }}
              >
                🎓 Student (22A91A0501)
              </button>
              <button
                type="button"
                onClick={() => { setUserType('faculty'); setIsRegister(false); setF({ ...f, email: 'faculty@aditya.edu', password: 'password123' }); }}
              >
                👨‍🏫 Faculty
              </button>
              <button
                type="button"
                onClick={() => { setUserType('faculty'); setIsRegister(false); setF({ ...f, email: 'hod@aditya.edu', password: 'password123' }); }}
              >
                🏛️ HOD
              </button>
              <button
                type="button"
                onClick={() => { setUserType('faculty'); setIsRegister(false); setF({ ...f, email: 'admin@aditya.edu', password: 'password123' }); }}
              >
                ⚡ Admin
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
