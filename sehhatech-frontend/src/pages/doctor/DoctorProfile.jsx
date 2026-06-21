import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function DoctorProfile() {
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ today: 0, upcoming: 0, patients: 0 });
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [bio, setBio] = useState("");
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editMsg, setEditMsg] = useState(null); // { text, success }

    useEffect(() => {
        async function fetchData() {
            try {
                const [profileRes, dashRes, patientsRes] = await Promise.all([
                    api.get("/api/Doctor/profile"),
                    api.get("/api/Doctor/dashboard"),
                    api.get("/api/Doctor/patients"),
                ]);
                setProfile(profileRes.data.data);
                setStats({
                    today: dashRes.data.data.appointmentsTodayCount,
                    upcoming: dashRes.data.data.upcomingAppointments.length,
                    patients: patientsRes.data.count,
                });
            } catch (err) {
                console.error("Profile load error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const d = profile;
    const name = d?.user?.fullName;
    const spec = d?.specialization;
    const imgUrl = photoPreview || d?.doctorProfileImageUrl || d?.user?.userProfileImageUrl;

    function openEditModal() {
        setBio(d?.bio ?? "");
        setPhotoPreview(null);
        setPhotoFile(null);
        setEditMsg(null);
        setShowModal(true);
    }

    function closeEditModal() {
        setShowModal(false);
        setPhotoFile(null);
        setPhotoPreview(null);
    }

    function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    }

    async function saveProfile() {
        setSaving(true);
        try {
            let photoUrl = d?.doctorProfileImageUrl || d?.user?.userProfileImageUrl || null;

            if (photoFile) {
                const formData = new FormData();
                formData.append("file", photoFile);
                    const uploadRes = await api.post("/api/upload/image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                photoUrl =
                    uploadRes.data.url || uploadRes.data.imageUrl || uploadRes.data.data?.url || photoUrl;
            }

            await api.put("/api/doctor/profile", {
                bio: bio.trim(),
                profileImageUrl: photoUrl,
            });

            setEditMsg({ text: "Profile updated successfully!", success: true });
            setProfile((prev) => ({
                ...prev,
                bio: bio.trim(),
                doctorProfileImageUrl: photoUrl,
            }));
            setTimeout(closeEditModal, 1500);
        } catch (err) {
            console.error(err);
            setEditMsg({ text: "Failed to save. Please try again.", success: false });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Layout>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                    <p className="text-slate-500 text-sm mt-1">Your personal and professional information</p>
                </div>
                <button
                    onClick={openEditModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-subtle"
                >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit Profile
                </button>
            </div>

            {/* Profile Hero Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary to-slate-600" />
                <div className="px-6 md:px-8 pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="relative flex-shrink-0" style={{ marginTop: "-40px" }}>
                            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-card bg-primary flex items-center justify-center overflow-hidden">
                                {imgUrl ? (
                                    <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <span
                                        className="material-symbols-outlined text-white text-4xl"
                                        style={{ fontVariationSettings: '"FILL" 1' }}
                                    >
                                        person
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="pb-1">
                            <h2 className="text-xl font-bold text-slate-900">{name}</h2>
                            <p className="text-slate-500 font-medium text-sm">{spec}</p>
                            <div className="mt-2">
                                {!loading && d && (
                                    d.isActive ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                                            Inactive
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {d?.bio && (
                        <div className="mt-5 pt-5 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">About</p>
                            <p className="text-slate-600 text-sm leading-relaxed">{d.bio}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-5">
                        <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                        Personal Information
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                            <p className="text-sm font-semibold text-slate-900 mt-1">{name ?? "-"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                            <p className="text-sm font-semibold text-slate-900 mt-1">{d?.user?.email ?? "-"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</p>
                            <p className="text-sm font-semibold text-slate-900 mt-1">Doctor</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-5">
                        <span className="material-symbols-outlined text-primary text-[18px]">medical_services</span>
                        Professional Information
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Doctor ID</p>
                            <p className="text-sm font-semibold text-slate-900 mt-1">{d ? `#${d.id}` : "-"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Specialization</p>
                            <p className="text-sm font-semibold text-slate-900 mt-1">{spec ?? "-"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                            <p className="text-sm font-semibold text-slate-900 mt-1">
                                {d ? (d.isActive ? "Active" : "Inactive") : "-"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 text-center">
                    <span
                        className="material-symbols-outlined text-primary text-2xl"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                        today
                    </span>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? "-" : stats.today}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Today</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 text-center">
                    <span
                        className="material-symbols-outlined text-primary text-2xl"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                        event_upcoming
                    </span>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? "-" : stats.upcoming}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Upcoming</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 text-center">
                    <span
                        className="material-symbols-outlined text-primary text-2xl"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                        group
                    </span>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? "-" : stats.patients}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Patients</p>
                </div>
            </div>

            {/* Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
                            <button
                                onClick={closeEditModal}
                                className="text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Photo Upload */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Profile Photo</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-slate-200">
                                        {imgUrl ? (
                                            <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <span
                                                className="material-symbols-outlined text-white text-3xl"
                                                style={{ fontVariationSettings: '"FILL" 1' }}
                                            >
                                                person
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors w-fit">
                                            <span className="material-symbols-outlined text-[18px]">upload</span>
                                            Choose Photo
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handlePhotoChange}
                                            />
                                        </label>
                                        <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    Bio
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Write a short bio about yourself..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                />
                            </div>

                            {/* Save message */}
                            {editMsg && (
                                <div
                                    className={`text-sm font-semibold px-4 py-3 rounded-xl ${editMsg.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                        }`}
                                >
                                    {editMsg.text}
                                </div>
                            )}
                        </div>
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={closeEditModal}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveProfile}
                                disabled={saving}
                                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}