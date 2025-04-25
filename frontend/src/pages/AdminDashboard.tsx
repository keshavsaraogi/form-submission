import api from "@/lib/api.ts";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { Loader2 } from "lucide-react";
import { logoutAdmin } from '@/lib/logoutAdmin.ts'
import { CSVLink } from "react-csv";

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
    const [verifyUserId, setVerifyUserId] = useState<string | null>(null);

    const handleGeneratePDF = async (userId: string) => {
        try {
            await api.post(`/api/admin/generate-pdf/${userId}`, {}, { withCredentials: true });
            toast({
                title: "PDF Generated",
                description: "PDF has been generated using the template.",
            });
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast({
                title: "Error",
                description: "Failed to generate PDF. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDownloadPDF = (userId: string, gstNumber: string) => {
        try {
            const link = document.createElement("a");
            link.href = `${import.meta.env.VITE_BACKEND_URL}/api/admin/download-pdf/${userId}`;
            link.setAttribute("download", `${gstNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast({
                title: "Error",
                description: "Download failed. Please try again.",
                variant: "destructive",
            });
        }
    };


    const csvHeaders = [
        { label: "Full Name", key: "fullName" },
        { label: "Firm Name", key: "firmName" },
        { label: "GST Number", key: "gstNumber" },
        { label: "Sales Rep Number", key: "salesRepNumber" },
        { label: "Contact Number", key: "contactNumber" },
        { label: "Verified", key: "verified" },
        { label: "Submitted At", key: "createdAt" }
    ];

    const validSubmissions = users.map((user) => ({
        fullName: user.fullName,
        firmName: user.firmName,
        gstNumber: user.gstNumber,
        salesRepNumber: user.salesRepNumber,
        contactNumber: user.contactNumber,
        verified: user.verified ? "Yes" : "No",
        createdAt: new Date(user.createdAt).toLocaleString()
    }));

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
            await api.patch(`/api/users/${userId}/verify`, {}, { withCredentials: true });
            toast({ title: "User verified successfully!" });
            //fetchUsers();
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user._id === userId ? { ...user, verified: true } : user
                )
            );
        } catch (error) {
            console.error(error);
            toast({
                title: "Error Verifying User",
                description: "Failed to verify user. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (userId: string) => {
        try {
            await api.delete(`/api/admin/delete-user/${userId}`, { withCredentials: true });
            toast({ title: "User deleted successfully!" });
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast({
                title: "Failed to delete user",
                description: "Failed to delete user. Please try again",
                variant: "destructive",
            });
        }
    };

    const handleLogout = async () => {
        const success = await logoutAdmin();
        if (success) {
            toast({
                title: "Logout Successful", 
                description: "You have been logged out."
            })
            navigate('/admin-login')
        } else {
            toast({
                title: 'Logout Failed',
                description: 'Unable to logout. Please try again.',
                variant: 'destructive'
            })
        }
    }

    const handleUpdateNotes = async (userId: string, notes: string) => {
        try {
            await api.patch(`/api/admin/user/${userId}/notes`, { notes }, { withCredentials: true });
            toast({ title: "Notes updated successfully" });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update notes. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleChecklistUpdate = async (
        userId: string,
        field: "cheque" | "letterhead",
        value: boolean
    ) => {
        try {
            await api.patch(`/api/users/${userId}/checklist`, {
                [field]: value,
            });

            toast({
                title: "Checklist Updated",
                description: `Marked ${field} as ${value ? "checked" : "unchecked"}.`,
            });

            fetchUsers();
        } catch (err) {
            toast({
                title: "Error Updating Checklist",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        }
    };

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
                        <CSVLink
                            data={validSubmissions}
                            headers={csvHeaders}
                            filename="form-submissions.csv"
                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                        >
                            Export CSV
                        </CSVLink>
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
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={user.checklist?.cheque}
                                                onChange={(e) =>
                                                    handleChecklistUpdate(user._id, "cheque", e.target.checked)
                                                }
                                            />
                                            Cheque
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={user.checklist?.letterhead}
                                                onChange={(e) =>
                                                    handleChecklistUpdate(user._id, "letterhead", e.target.checked)
                                                }
                                            />
                                            Letterhead
                                        </label>
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                <div>
                                    <label htmlFor={`notes-${user._id}`} className="block text-sm font-medium mb-1">
                                        Admin Notes:
                                    </label>
                                    <textarea
                                        id={`notes-${user._id}`}
                                        className="w-full p-2 border rounded-md text-sm"
                                        rows={3}
                                        defaultValue={user.notes}
                                        onBlur={(e) => handleUpdateNotes(user._id, e.target.value)}
                                        placeholder="Add notes here (e.g. follow-up needed)"
                                    />
                                </div>

                                

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
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleVerify(user._id)}
                                            disabled={verifyUserId === user._id}
                                        >
                                            {verifyUserId === user._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Verify"
                                            )}
                                        </Button>
                                    )}

                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(user._id)}
                                    >
                                        Delete
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGeneratePDF(user._id)}
                                    >
                                        Generate PDF
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            const link = document.createElement("a");
                                            link.href = `${import.meta.env.VITE_BACKEND_URL}/api/admin/download-pdf/${user._id}`;
                                            link.setAttribute("download", `${user.gstNumber}.pdf`);
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                        }}
                                    >
                                        Download PDF
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

