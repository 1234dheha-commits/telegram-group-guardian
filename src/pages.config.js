import ActivityLog from './pages/ActivityLog';
import BotSetup from './pages/BotSetup';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActivityLog": ActivityLog,
    "BotSetup": BotSetup,
    "Dashboard": Dashboard,
    "Reports": Reports,
    "Settings": Settings,
    "Users": Users,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};