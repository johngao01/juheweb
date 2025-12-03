// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import {BrowserRouter, Routes, Route} from "react-router-dom";
import ItemDetail from "./ItemDetail.jsx";
import AuthGate from "./components/AuthGate";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthGate>
                <Routes>
                    <Route path="/" element={<App/>}/>
                    <Route path="/show/:id" element={<ItemDetail/>}/>
                </Routes>
            </AuthGate>
        </BrowserRouter>
    </React.StrictMode>,
)