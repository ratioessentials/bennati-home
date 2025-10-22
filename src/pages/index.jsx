import Layout from "./Layout.jsx";
import Login from "./Login.jsx";

import OperatorSupplies from "./OperatorSupplies";

import Apartments from "./Apartments";

import Properties from "./Properties";

import AdminChecklists from "./AdminChecklists";

import Operators from "./Operators";

import AdminSupplies from "./AdminSupplies";

import OperatorChecklist from "./OperatorChecklist";

import Dashboard from "./Dashboard";

import OperatorWorkflow from "./OperatorWorkflow";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    OperatorSupplies: OperatorSupplies,
    
    Apartments: Apartments,
    
    Properties: Properties,
    
    AdminChecklists: AdminChecklists,
    
    Operators: Operators,
    
    AdminSupplies: AdminSupplies,
    
    OperatorChecklist: OperatorChecklist,
    
    Dashboard: Dashboard,
    
    OperatorWorkflow: OperatorWorkflow,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    // Pagina di login senza Layout
    if (location.pathname === '/login') {
        return <Login />;
    }
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<Dashboard />} />
                
                <Route path="/OperatorSupplies" element={<OperatorSupplies />} />
                
                <Route path="/Apartments" element={<Apartments />} />
                
                <Route path="/Properties" element={<Properties />} />
                
                <Route path="/AdminChecklists" element={<AdminChecklists />} />
                
                <Route path="/Operators" element={<Operators />} />
                
                <Route path="/AdminSupplies" element={<AdminSupplies />} />
                
                <Route path="/OperatorChecklist" element={<OperatorChecklist />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/OperatorWorkflow" element={<OperatorWorkflow />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}