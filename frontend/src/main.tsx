import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import { AppNavbar } from './components/common/Navbar/Navbar'
import { Footer } from './components/common/Footer/Footer'
import { HomePage } from './pages/HomePage'
import PigmentsPage from './pages/PigmentsPage'
import { PigmentDetailPage } from './pages/PigmentDetailPage'
import LoginPage from './pages/LoginPage'
import ApplicationPage from './pages/ApplicationPage'
import SpectrumAnalysisListPage from './pages/SpectrumAnalysisListPage'
import ProfilePage from './pages/ProfilePage'
import { ROUTES } from './Routes'
import { registerSW } from 'virtual:pwa-register'
import store from './store'
import { IS_TAURI } from './config/target'

// ErrorBoundary для обработки ошибок
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Ошибка в приложении:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Что-то пошло не так</h1>
          <p>{this.state.error?.message || 'Произошла ошибка'}</p>
          <button onClick={() => window.location.reload()}>Перезагрузить страницу</button>
        </div>
      )
    }

    return this.props.children
  }
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="app-layout">
    <AppNavbar />
    <main className="main-content">
      {children}
    </main>
    <Footer />
  </div>
)

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: (
      <Layout>
        <HomePage />
      </Layout>
    )
  },
  {
    path: ROUTES.PIGMENTS,
    element: (
      <Layout>
        <PigmentsPage />
      </Layout>
    )
  },
  {
    path: `${ROUTES.PIGMENTS}/:id`,
    element: (
      <Layout>
        <PigmentDetailPage />
      </Layout>
    )
  },
  {
    path: ROUTES.LOGIN,
    element: (
      <Layout>
        <LoginPage />
      </Layout>
    )
  },
  {
    path: `${ROUTES.APPLICATION}/:id`,
    element: (
      <Layout>
        <ApplicationPage />
      </Layout>
    )
  },
  {
    path: ROUTES.SPECTRUM,
    element: (
      <Layout>
        <SpectrumAnalysisListPage />
      </Layout>
    )
  },
  {
    path: ROUTES.PROFILE,
    element: (
      <Layout>
        <ProfilePage />
      </Layout>
    )
  }
], {
  // Для Tauri всегда используем '/', для веба - BASE_URL (может быть '/SA-Frontend/' для GitHub Pages)
  basename: IS_TAURI ? '/' : import.meta.env.BASE_URL,
})

console.log('Инициализация приложения...')

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

console.log('Root element найден, создаю роутер...')

try {
  console.log('Запуск рендеринга приложения...')
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <Provider store={store}>
          <RouterProvider router={router} />
        </Provider>
      </ErrorBoundary>
    </StrictMode>,
  )
  console.log('Приложение успешно загружено!')
} catch (error) {
  console.error('Критическая ошибка при запуске приложения:', error)
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Критическая ошибка</h1>
      <p>${error instanceof Error ? error.message : 'Неизвестная ошибка'}</p>
      <p>Проверьте консоль браузера для подробностей.</p>
      <pre>${error instanceof Error ? error.stack : JSON.stringify(error)}</pre>
    </div>
  `
}

if ('serviceWorker' in navigator) {
  registerSW()
}
