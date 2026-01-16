import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Reports from './pages/Reports';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';
import BotSetup from './pages/BotSetup';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Users": Users,
    "Reports": Reports,
    "ActivityLog": ActivityLog,
    "Settings": Settings,
    "BotSetup": BotSetup,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};