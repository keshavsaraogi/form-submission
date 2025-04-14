import api from "@/lib/api.ts";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { Loader2 } from "lucide-react";
import { logoutAdmin } from '@/lib/logoutAdmin.ts'

interface User {
    _id: string;
    fullName: string;
    firmName: string;
    gstNumber: string;
    salesRepNumber: string;
    contactNumber: string;
    documents?: {
        gstCertificate?: string;
        aadharCard?: string;
        pancard?: string;
        shopPhoto?: string;
    };
    checklist: {
        cheque: boolean;
        letterhead: boolean;
    };
    verified: boolean;
    createdAt: string;
    notes?: string;
}

const AdminDashboard = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            const response = await api.get("/api/admin/users", { withCredentials: true });
            setUsers(response.data.users || []);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error fetching users",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchSignedUrl = async (filePath: string) => {
        try {
            const res = await api.post(
                "/api/admin/get-signed-url",
                { filePath },
                { withCredentials: true }
            );
            return res.data.signedUrl;
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Failed to open document",
                description: "Could not generate a secure link. Please try again.",
            });
            return null;
        }
    };

    const handleViewDocument = async (filePath: string) => {
        const signedUrl = await fetchSignedUrl(filePath);
        if (signedUrl) {
            window.open(signedUrl, "_blank");
        }
    };

    const handleVerify = async (userId: string) => {
        try {
            await api.post(`/api/admin/verify-user`, { userId }, { withCredentials: true });
            toast({ title: "User verified successfully!" });
            fetchUsers(); // Refresh users
        } catch (error) {
            console.error(error);
            toast({
                title: "Failed to verify user",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (userId: string) => {
        try {
            await api.delete(`/api/admin/delete-user/${userId}`, { withCredentials: true });
            toast({ title: "User deleted successfully!" });
            fetchUsers(); // Refresh users
        } catch (error) {
            console.error(error);
            toast({
                title: "Failed to delete user",
                variant: "destructive",
            });
        }
    };

    const handleLogout = async () => {
        const success = await logoutAdmin();
        if (success) {
            navigate('/admin-login')
        }
    }

    const filteredUsers = users
        .filter((user) => {
            const query = searchQuery.toLowerCase();
            return (
                user.fullName?.toLowerCase().includes(query) ||
                user.firmName?.toLowerCase().includes(query) ||
                user.gstNumber?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            if (sortOrder === "asc" || sortOrder === "desc") {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
            } else if (sortOrder === "verified") {
                return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
            } else if (sortOrder === "unverified") {
                return (a.verified ? 1 : 0) - (b.verified ? 1 : 0);
            }
            return 0;
        });

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col gap-6">
                {/* Top Bar */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2 className="text-3xl font-bold">Admin Dashboard</h2>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold">Welcome, Admin!</h1>
                        <Button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                        >
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Search + Sort */}
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search by name, firm, or GST"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border rounded-md flex-1"
                    />
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="px-4 py-2 border rounded-md"
                    >
                        <option value="desc">Newest</option>
                        <option value="asc">Oldest</option>
                        <option value="verified">Verified First</option>
                        <option value="unverified">Unverified First</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin" />
                </div>
            ) : (
                <>
                    {currentUsers.length === 0 ? (
                        <div className="text-center text-gray-500">
                            No submissions found.
                        </div>
                    ) : (
                        currentUsers.map((user) => (
                            <div key={user._id} className="border rounded-lg p-4 space-y-3 shadow">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><strong>Full Name:</strong> {user.fullName}</div>
                                    <div><strong>Firm Name:</strong> {user.firmName}</div>
                                    <div><strong>GST Number:</strong> {user.gstNumber}</div>
                                    <div><strong>Sales Rep Number:</strong> {user.salesRepNumber}</div>
                                    <div><strong>Contact Number:</strong> {user.contactNumber}</div>
                                    <div><strong>Submitted At:</strong> {new Date(user.createdAt).toLocaleString()}</div>
                                </div>

                                {/* Documents Section */}
                                {user.documents && (
                                    <div className="flex flex-col space-y-1 pt-2">
                                        <strong>Documents:</strong>
                                        {user.documents.gstCertificate && (
                                            <Button variant="link" className="text-blue-600 underline p-0 justify-start" onClick={() => handleViewDocument(user.documents!.gstCertificate!)}>
                                                View GST Certificate
                                            </Button>
                                        )}
                                        {user.documents.aadharCard && (
                                            <Button variant="link" className="text-blue-600 underline p-0 justify-start" onClick={() => handleViewDocument(user.documents!.aadharCard!)}>
                                                View Aadhar Card
                                            </Button>
                                        )}
                                        {user.documents.pancard && (
                                            <Button variant="link" className="text-blue-600 underline p-0 justify-start" onClick={() => handleViewDocument(user.documents!.pancard!)}>
                                                View PAN Card
                                            </Button>
                                        )}
                                        {user.documents.shopPhoto && (
                                            <Button variant="link" className="text-blue-600 underline p-0 justify-start" onClick={() => handleViewDocument(user.documents!.shopPhoto!)}>
                                                View Shop Photo
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Checklist */}
                                <div className="flex flex-col space-y-1">
                                    <strong>Checklist:</strong>
                                    <div className="flex gap-2">
                                        <Badge variant={user.checklist.cheque ? "default" : "outline"}>Cheque</Badge>
                                        <Badge variant={user.checklist.letterhead ? "default" : "outline"}>Letterhead</Badge>
                                    </div>
                                </div>

                                {/* Notes */}
                                {user.notes && (
                                    <div>
                                        <strong>Notes:</strong> {user.notes}
                                    </div>
                                )}

                                {/* Verified Status */}
                                <div>
                                    <strong>Verified:</strong>{" "}
                                    <Badge variant={user.verified ? "default" : "destructive"}>
                                        {user.verified ? "Yes" : "No"}
                                    </Badge>
                                </div>

                                {/* Actions (Verify / Delete) */}
                                <div className="flex gap-3">
                                    {!user.verified && (
                                        <Button size="sm" variant="default" onClick={() => handleVerify(user._id)}>
                                            Verify
                                        </Button>
                                    )}
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(user._id)}>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
