import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import ScrollToTop from './ScrollToTop'
import { site } from '../lib/content'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/works', label: '作品' },
  { to: '/about', label: '关于' },
  { to: '/contact', label: '联系' },
]

export default function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  useEffect(() => {
    const name = site.name?.trim() || 'Portfolio'
    const role = site.role?.trim()
    document.title = role ? `${name} · ${role}` : name
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />

      {/* 固定导航 */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-paper/95 backdrop-blur border-b border-line' : 'bg-transparent'
        }`}
      >
        <div className="container-site flex h-14 items-center justify-between md:h-16">
          <Link
            to="/"
            className={`text-sm font-medium tracking-wide transition-colors md:text-[15px] ${
              !scrolled && location.pathname === '/' ? 'text-ink-mute' : 'text-ink'
            }`}
          >
            {site.name || 'Portfolio'}
            <span
              className={`ml-2 hidden text-xs sm:inline ${
                !scrolled && location.pathname === '/' ? 'text-ink-mute/70' : 'text-ink-mute'
              }`}
            >
              {site.role}
            </span>
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group relative text-sm transition-colors ${
                    isActive ? 'text-ink' : 'text-ink-mute hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-px bg-accent transition-all duration-300 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* 移动端菜单按钮 */}
          <button
            className="flex h-10 w-10 items-center justify-center md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="菜单"
          >
            <div className="space-y-1.5">
              <span
                  className={`block h-px w-5 transition-transform ${
                    menuOpen
                      ? 'translate-y-[3.5px] rotate-45 bg-ink'
                      : `bg-ink ${!scrolled && location.pathname === '/' ? 'bg-ink-mute' : 'bg-ink'}`
                  }`}
                />
                <span
                  className={`block h-px w-5 transition-transform ${
                    menuOpen
                      ? '-translate-y-[3px] -rotate-45 bg-ink'
                      : `bg-ink ${!scrolled && location.pathname === '/' ? 'bg-ink-mute' : 'bg-ink'}`
                  }`}
                />
            </div>
          </button>
        </div>

        {/* 移动端抽屉 */}
        {menuOpen && (
          <nav className="border-b border-line bg-paper px-6 pb-6 pt-2 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block py-3 text-base ${isActive ? 'text-accent' : 'text-ink-soft'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 pt-14 md:pt-16">
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer className="border-t border-line">
        <div className="container-site flex flex-col gap-4 py-10 text-xs text-ink-mute md:flex-row md:items-center md:justify-between">
          <p>© 2026 {site.name || 'Your Name'}. All rights reserved.</p>
          <div className="flex gap-6">
            {(site.socials || []).map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-accent"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
