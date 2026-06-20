import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOtp from './pages/VerifyOtp'
import Clinics from './pages/Clinics'
import BookAppointment from './pages/BookAppointment'
import MyBookings from './pages/MyBookings'

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/clinics" element={<Clinics />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/my-bookings" element={<MyBookings />} />
        </Routes>
    )
}