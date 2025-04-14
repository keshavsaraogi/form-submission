import api from "../lib/api.ts";

export const logoutAdmin = async () => {
    try {
        await api.post("/api/admin/logout")
        return true;
    } catch (err) {
        console.log("Logout Failed", err)
        return false;
    }
}

