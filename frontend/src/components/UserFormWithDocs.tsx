import { useState } from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import api from '@/lib/api.ts';

const UserFormWithDocs = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    firmName: '',
    gstNumber: '',
    salesRepNumber: '',
    contactNumber: '',
    districtArea: '', // ✅ New field
    cheque: false,
    letterhead: false,
    notes: '',
  });

  const [files, setFiles] = useState<{
    gstCertificate: File | null;
    aadharCard: File | null;
    pancard: File | null;
    shopPhoto: File | null;
  }>({
    gstCertificate: null,
    aadharCard: null,
    pancard: null,
    shopPhoto: null,
  });

  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0] || null;
    setFiles((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  const phoneRegex = /^[6-9]\d{9}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate GST Number
    if (!gstRegex.test(formData.gstNumber)) {
      toast({
        title: 'Invalid GST Number',
        description: 'Please enter a valid GST Number.',
        variant: 'destructive',
      });
      return;
    }

    // ✅ Validate Phone Number
    if (!phoneRegex.test(formData.contactNumber)) {
      toast({
        title: 'Invalid Contact Number',
        description: 'Phone number must be 10 digits starting with 6-9.',
        variant: 'destructive',
      });
      return;
    }

    // ✅ Validate if all 4 documents are uploaded
    if (!files.gstCertificate || !files.aadharCard || !files.pancard || !files.shopPhoto) {
      toast({
        title: 'Missing Documents',
        description: 'Please upload all 4 required documents.',
        variant: 'destructive',
      });
      return;
    }

    const form = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value as string);
    });

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        form.append(key, file);
      }
    });

    try {
      await api.post('/api/users', form);

      toast({
        title: 'Form submitted successfully!',
      });

      // ✅ Optionally reset form here if you want
    } catch (err: any) {
      let description = 'Submission failed. Please try again.';

      if (err.response?.data?.error) {
        if (err.response.data.error.includes('duplicate key error') || err.response.data.error.includes('GST already exists')) {
          description = 'Duplicate GST Number found. Please use a unique GST.';
        } else if (err.response.data.error.includes('file upload failed')) {
          description = 'One or more file uploads failed. Please retry.';
        } else {
          description = err.response.data.error;
        }
      }

      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-50 py-10">
      <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow space-y-8">
        <h1 className="text-2xl font-bold text-center">Form Submission Portal</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-2">
                    <label className="font-semibold">Full Name</label>
                    <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    />
                </div>

                <div className="flex flex-col space-y-2">
                    <label className="font-semibold">Firm Name</label>
                    <Input
                    type="text"
                    value={formData.firmName}
                    onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                    required
                    />
                </div>

                <div className="flex flex-col space-y-2">
                    <label className="font-semibold">GST Number</label>
                    <Input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    required
                    />
                </div>

                <div className="flex flex-col space-y-2">
                    <label className="font-semibold">Sales Rep Number</label>
                    <Input
                    type="text"
                    value={formData.salesRepNumber}
                    onChange={(e) => setFormData({ ...formData, salesRepNumber: e.target.value })}
                    required
                    />
                </div>

                <div className="flex flex-col space-y-2">
                    <label className="font-semibold">Contact Number</label>
                    <Input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    required
                    />
                </div>

                {/* New District Area Field */}
                <div className="flex flex-col space-y-2">
                    <label className="font-semibold">District Area</label>
                    <Input
                    type="text"
                    value={formData.districtArea}
                    onChange={(e) => setFormData({ ...formData, districtArea: e.target.value })}
                    />
                </div>
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2">
                    <label className="font-semibold">GST Certificate</label>
                    <Input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'gstCertificate')} />
                    </div>
                    <div className="flex flex-col space-y-2">
                    <label className="font-semibold">Aadhar Card</label>
                    <Input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'aadharCard')} />
                    </div>
                    <div className="flex flex-col space-y-2">
                    <label className="font-semibold">Pancard</label>
                    <Input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'pancard')} />
                    </div>
                    <div className="flex flex-col space-y-2">
                    <label className="font-semibold">Shop Photo</label>
                    <Input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'shopPhoto')} />
                    </div>
                </div>
            </div>

            {/* Checklist Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Checklist</h2>
                <div className="flex flex-col space-y-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={formData.cheque}
                            onChange={(e) => setFormData({ ...formData, cheque: e.target.checked })}
                            className="h-4 w-4"
                        />
                        <span>Cheque Submitted</span>
                    </label>

                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={formData.letterhead}
                            onChange={(e) => setFormData({ ...formData, letterhead: e.target.checked })}
                            className="h-4 w-4"
                        />
                        <span>Letterhead Submitted</span>
                    </label>
                </div>
            </div>

            {/* Notes Section */}
            <div className="flex flex-col space-y-2">
                <label className="font-semibold">Additional Notes (optional)</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="border rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Write any additional information here..."
                />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full">
            Submit
            </Button>
        </form>
      </div>
    </div>
  );
};

export default UserFormWithDocs;
