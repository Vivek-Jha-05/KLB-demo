import React, { useEffect, useState } from 'react';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Download
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { usePrescriptionStore } from '../../store/prescriptionStore';
import { Prescription } from '../../types';
import { logger } from '../../utils/logger';
import { toast } from 'sonner';
import { getErrorMessage } from '../../utils/errorUtils';

export const AdminPrescriptionsPage: React.FC = () => {
  const { fetchAllPrescriptions, prescriptions, updatePrescriptionStatus } = usePrescriptionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    void fetchAllPrescriptions();
  }, [fetchAllPrescriptions]);

  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = 
      rx.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = prescriptions.filter(p => p.status === 'pending').length;
  const approvedCount = prescriptions.filter(p => p.status === 'approved').length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = async (id: string) => {
    try {
      await updatePrescriptionStatus(id, 'approved', 'Admin');
      setSelectedPrescription(null);
      toast.success('Prescription approved successfully');
    } catch (error) {
      logger.error('Failed to approve prescription');
      toast.error(getErrorMessage(error, 'Unable to approve prescription. Please check your connection and try again.'));
    }
  };

  const handleReject = async () => {
    if (selectedPrescription && rejectReason.trim()) {
      try {
        await updatePrescriptionStatus(
          selectedPrescription.id,
          'rejected',
          'Admin',
          rejectReason,
        );
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedPrescription(null);
        toast.success('Prescription rejected successfully');
      } catch (error) {
        logger.error('Failed to reject prescription');
        toast.error(getErrorMessage(error, 'Unable to reject prescription. Please check your connection and try again.'));
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescription Management</h1>
          <p className="text-gray-600">Review and verify customer prescriptions</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{pendingCount} pending review(s)</span>
          </div>
        )}
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-lg border transition-all ${
            statusFilter === 'all' 
              ? 'border-emerald-500 bg-emerald-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <FileText className="w-6 h-6 text-gray-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
          <p className="text-sm text-gray-500">Total</p>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-lg border transition-all ${
            statusFilter === 'pending' 
              ? 'border-yellow-500 bg-yellow-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Clock className="w-6 h-6 text-yellow-600 mb-2" />
          <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-lg border transition-all ${
            statusFilter === 'approved' 
              ? 'border-emerald-500 bg-emerald-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      <div className="grid gap-4">
        {filteredPrescriptions.map((rx) => (
          <Card key={rx.id} className={rx.status === 'pending' ? 'border-l-4 border-l-orange-500' : ''}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Prescription Thumbnail */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{rx.userName}</h3>
                      <p className="text-sm text-gray-500">{rx.fileName}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(rx.status)}`}>
                      {getStatusIcon(rx.status)}
                      <span className="capitalize">{rx.status}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(rx.createdAt)}
                    </span>
                    {rx.reviewedAt && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Reviewed: {formatDate(rx.reviewedAt)}
                      </span>
                    )}
                  </div>
                  {rx.notes && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      <span className="font-medium">Rejection reason:</span> {rx.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPrescription(rx)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {rx.status === 'pending' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => void handleApprove(rx.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedPrescription(rx);
                          setShowRejectModal(true);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPrescriptions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No prescriptions found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Prescription Modal */}
      <Modal
        isOpen={!!selectedPrescription && !showRejectModal}
        onClose={() => setSelectedPrescription(null)}
        title="Prescription Details"
        size="lg"
      >
        {selectedPrescription && (
          <div className="space-y-6">
            {/* Prescription Image Preview */}
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{selectedPrescription.fileName}</p>
              <a href={selectedPrescription.fileUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Prescription
                </Button>
              </a>
            </div>

            {/* Customer Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Customer</h4>
                <p className="font-medium">{selectedPrescription.userName}</p>
                <p className="text-sm text-gray-500">User ID: {selectedPrescription.userId}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Uploaded</h4>
                <p className="font-medium">{formatDate(selectedPrescription.createdAt)}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Current Status</span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(selectedPrescription.status)}`}>
                {getStatusIcon(selectedPrescription.status)}
                <span className="capitalize">{selectedPrescription.status}</span>
              </span>
            </div>

            {/* Actions */}
            {selectedPrescription.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="danger"
                  onClick={() => setShowRejectModal(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void handleApprove(selectedPrescription.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}

            {selectedPrescription.status !== 'pending' && (
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedPrescription(null)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
        }}
        title="Reject Prescription"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Rejection Reason Required</p>
              <p className="text-sm text-red-600">
                Please provide a clear reason for rejecting this prescription.
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Rejection
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g., Prescription is expired, image is unclear, prescription doesn't match ordered medicines..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Prescription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
