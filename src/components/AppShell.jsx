import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { navigationItems } from '../data/appData'
import Icon from './Icon'

function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <NavLink className="brand" to="/" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark">
              <Icon name="document" size={21} />
            </span>
            <span>Resume<span>Forge</span></span>
          </NavLink>

          <button
            className="menu-button"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>

          <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <NavLink className="button button-primary header-cta" to="/builder">
            Build your resume
            <Icon name="arrowRight" size={17} />
          </NavLink>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="brand footer-brand">
            <span className="brand-mark">
              <Icon name="document" size={19} />
            </span>
            <span>Resume<span>Forge</span></span>
          </div>
          <p>Build a stronger resume with clarity, confidence, and control.</p>
          <span>Foundation prototype</span>
        </div>
      </footer>
    </div>
  )
}

export default AppShell
