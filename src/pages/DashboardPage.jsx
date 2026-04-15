import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import DashboardOverview from '../components/dashboard/DashboardOverview'
import StoreBuilder from '../components/dashboard/StoreBuilder'
import StatsPanel from '../components/dashboard/StatsPanel'
import ChatPanel from '../components/dashboard/ChatPanel'
import GlobalChat from '../components/dashboard/GlobalChat'
import ExplorePanel from '../components/dashboard/ExplorePanel'
import SettingsPanel from '../components/dashboard/SettingsPanel'
import HelpPanel from '../components/dashboard/HelpPanel'
import AdminPage from './AdminPage'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [dmUser, setDmUser] = useState(null)

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <DashboardOverview setActiveTab={setActiveTab} />
      case 'builder': return <StoreBuilder />
      case 'stats': return <StatsPanel />
      case 'chat': return <ChatPanel dmUser={dmUser} setDmUser={setDmUser} />
      case 'global': return <GlobalChat />
      case 'explore': return <ExplorePanel setActiveTab={setActiveTab} setDmUser={setDmUser} />
      case 'settings': return <SettingsPanel />
      case 'help': return <HelpPanel tab="help" />
      case 'report': return <HelpPanel tab="report" />
      case 'admin': return user?.is_admin ? <AdminPage inline /> : null
      default: return <DashboardOverview setActiveTab={setActiveTab} />
    }
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  )
}
