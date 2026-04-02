import React, { useEffect, useRef, useState } from 'react';

import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Image,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { usePrescriptionStore } from '../store/prescriptionStore';
import { AuthModal } from '../components/auth/AuthModal';
import { logger } from '../utils/logger';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errorUtils';

export const PrescriptionUploadPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const { fetchMyPrescriptions, getUserPrescriptions, uploadPrescription } =
    usePrescriptionStore();

  const userPrescriptions = user ? getUserPrescriptions(user.id) : [];

  useEffect(() => {
    if (isAuthenticated) {
      void fetchMyPrescriptions();
    }
  }, [fetchMyPrescriptions, isAuthenticated]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      await uploadPrescription(selectedFile);
      setUploadSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success('Prescription uploaded successfully. We will review it shortly.');
    } catch (error) {
      logger.error('Prescription upload failed');
      toast.error(getErrorMessage(error, 'Unable to upload prescription. Please try again.'));
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your Prescription
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload a valid prescription from a registered medical practitioner.
          Our pharmacists will verify and process your order within 24 hours.
        </p>
      </div>

      {uploadSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">
                Prescription Uploaded Successfully!
              </h4>
              <p className="text-sm text-green-700">
                Our pharmacists will review your prescription and notify you once approved.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUploadSuccess(false)}
              className="ml-auto"
            >
              Upload Another
            </Button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Upload Prescription</h2>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                selectedFile
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-300 hover:border-emerald-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-4">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-48 mx-auto rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-emerald-600" />
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-700 font-medium">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={removeFile}
                      className="p-1 hover:bg-gray-200 rounded-full"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <Button onClick={handleUpload} isLoading={isUploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Prescription
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">
                    Drag and drop your prescription here, or
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                  <p className="text-sm text-gray-500 mt-4">
                    Supported formats: JPG, PNG, PDF (Max 5MB)
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">
                    Prescription Guidelines
                  </h4>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Prescription must be from a registered doctor</li>
                    <li>• Must be dated within the last 6 months</li>
                    <li>• Should clearly show patient name & medicines</li>
                    <li>• Doctor's signature and registration number required</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Prescriptions */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Your Prescriptions</h2>
          </CardHeader>
          <CardContent>
            {!isAuthenticated ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">
                  Login to view your prescription history
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Login
                </Button>
              </div>
            ) : userPrescriptions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No prescriptions uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userPrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-white border rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {prescription.fileName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(prescription.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: 1,
              title: 'Upload',
              description: 'Upload a clear image of your prescription'
            },
            {
              step: 2,
              title: 'Verify',
              description: 'Our pharmacists verify your prescription'
            },
            {
              step: 3,
              title: 'Order',
              description: 'Add prescribed medicines to your cart'
            },
            {
              step: 4,
              title: 'Deliver',
              description: 'Get medicines delivered to your doorstep'
            }
          ].map((item, index) => (
            <div key={item.step} className="text-center relative">
              {index < 3 && (
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-emerald-200" />
              )}
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold relative z-10">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
