import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // لما المشروع يفتح، نقرأ بيانات المستخدم المحفوظة (لو موجودة)
    

    useEffect(() => {
  const token = localStorage.getItem("token");
  const fullName = localStorage.getItem("fullName");
  const email = localStorage.getItem("email");
  const role = localStorage.getItem("role");
  const tenantId = localStorage.getItem("tenantId");

  if (token) {
    setUser({ token, fullName, email, role, tenantId });
  }

  setLoading(false);
}, []);

    // تسجيل الدخول: نحفظ البيانات في localStorage أو sessionStorage
   


    function login(data, remember) {
    const storage = localStorage; // 👈 خليها واحدة بس (أسهل وأضمن)

    storage.setItem("token", data.token);
    storage.setItem("fullName", data.fullName);
    storage.setItem("email", data.email);
    storage.setItem("role", data.role);

    setUser(data);
}

    // تسجيل الخروج
    function logout() {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// hook عشان نستخدم الـ context بسهولة في أي مكون
export function useAuth() {
    return useContext(AuthContext);
}