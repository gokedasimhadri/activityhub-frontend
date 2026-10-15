import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { errMsg } from '../api';
import { useMeta } from '../meta.js';

const forms = [['2.6', 'Workshops organized', '#2b4fd8'], ['2.7', 'Guest lectures', '#0f9d8a'], ['2.10', 'Industrial visits', '#0369a1'], ['5.4', 'Extension & outreach', '#15803d'], ['5.5', 'Student clubs', '#ea580c'], ['6.2', 'Entrepreneurship events', '#be123c']];

export default function Login() {
  const { login, register } = useAuth();
  const meta = useMeta();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', department: 'CSE' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { mode === 'login' ? await login(f.email, f.password) : await register(f); } catch (x) { setErr(errMsg(x)); }
  };
  return (
    <div className="login">
      <section className="hero">
        <h1>Every workshop, lecture and visit, recorded once.</h1>
        <p>Enter an activity, add the students who took part, get it approved, and export the university form.</p>
        <ul className="formlist">
          {forms.map(([n, t, c]) => <li key={n} style={{ '--c': c }}><b>Form {n}</b><span>{t}</span></li>)}
        </ul>
      </section>
      <section className="panel">
        <form onSubmit={submit} className="loginform">
          <h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
          {mode === 'register' && <label>Full name<input required value={f.name} onChange={set('name')} /></label>}
          <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
          <label>Password<input type="password" required minLength={6} value={f.password} onChange={set('password')} /></label>
          {mode === 'register' && (
            <label>Department
              <select value={f.department} onChange={set('department')}>{(meta?.departments || ['CSE']).map((d) => <option key={d}>{d}</option>)}</select>
            </label>
          )}
          {err && <div className="alert err">{err}</div>}
          <button className="btn primary wide">{mode === 'login' ? 'Log in' : 'Create account'}</button>
          <button type="button" className="linkbtn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
            {mode === 'login' ? 'New faculty? Create an account' : 'Already registered? Log in'}
          </button>
          {mode === 'login' && (
            <div className="demo">
              <small>Demo accounts (after running the seed script, password <code>password123</code>)</small>
              <div>{['faculty', 'hod', 'admin'].map((r) => <button type="button" key={r} onClick={() => setF({ ...f, email: `${r}@aditya.edu`, password: 'password123' })}>{r}</button>)}</div>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
