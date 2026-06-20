import { useState, useEffect } from "react";
import api from "../api/axios";

export function useDoctorProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await api.get("/api/Doctor/profile");
                setProfile(res.data.data);
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    return { profile, loading, setProfile };
}