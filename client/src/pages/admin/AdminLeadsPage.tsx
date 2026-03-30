import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Eye,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  ChevronDown,
  Inbox,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../lib/api';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
  updatedAt: string;
}

interface LeadsResponse {
  leads: Lead[];
  page: number;
  totalPages: number;
  total: number;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';

const getStoredToken = (): string | null => {
  const raw = window.localStorage.getItem('auth-storage');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { token?: string | null }; token?: string | null };
    return parsed.state?.token ?? parsed.token ?? null;
  } catch {
    return null;
  }
};

const fetchLeads = async (status?: string): Promise<LeadsResponse> => {
  const token = getStoredToken();
  const query = status && status !== 'all' ? `?status=${status}` : '';
  const response = await fetch(`${API_BASE_URL}/leads/admin${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      (body as { message?: string }).message || 'Failed to fetch leads',
      response.status,
      body,
    );
  }

  return response.json() as Promise<LeadsResponse>;
};

const updateLeadStatus = async (id: string, status: string): Promise<Lead> => {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/leads/admin/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      (body as { message?: string }).message || 'Failed to update lead status',
      response.status,
      body,
    );
  }

  return response.json() as Promise<Lead>;
};

export const AdminLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeads(statusFilter);
      setLeads(data.leads);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const statuses = [
    { value: 'all', label: 'All Messages' },
    { value: 'new', label: 'New' },
    { value: 'read', label: 'Read' },
    { value: 'replied', label: 'Replied' },
  ];

  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.subject.toLowerCase().includes(q)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-4 h-4" />;
      case 'read':
        return <Eye className="w-4 h-4" />;
      case 'replied':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      read: 'bg-yellow-100 text-yellow-700',
      replied: 'bg-emerald-100 text-emerald-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const updated = await updateLeadStatus(leadId, newStatus);
      setLeads((prev) => prev.map((l) => (l._id === leadId ? updated : l)));
      setShowStatusDropdown(null);

      if (selectedLead && selectedLead._id === leadId) {
        setSelectedLead(updated);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to update status');
    }
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    const flow: Record<string, string[]> = {
      new: ['read', 'replied'],
      read: ['replied'],
      replied: [],
    };
    return flow[currentStatus] || [];
  };

  const newCount = leads.filter((l) => l.status === 'new').length;
  const readCount = leads.filter((l) => l.status === 'read').length;
  const repliedCount = leads.filter((l) => l.status === 'replied').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
          <p className="text-gray-600">Messages from the contact form on the website</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{filteredLeads.length} messages</span>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter('new')}
          className={`p-4 rounded-lg border transition-all ${
            statusFilter === 'new'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-blue-100 text-blue-700">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{newCount}</p>
          <p className="text-xs text-gray-500">New</p>
        </button>
        <button
          onClick={() => setStatusFilter('read')}
          className={`p-4 rounded-lg border transition-all ${
            statusFilter === 'read'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-yellow-100 text-yellow-700">
            <Eye className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{readCount}</p>
          <p className="text-xs text-gray-500">Read</p>
        </button>
        <button
          onClick={() => setStatusFilter('replied')}
          className={`p-4 rounded-lg border transition-all ${
            statusFilter === 'replied'
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{repliedCount}</p>
          <p className="text-xs text-gray-500">Replied</p>
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLeads.map((lead) => (
                <tr key={lead._id} className={`hover:bg-gray-50 ${lead.status === 'new' ? 'bg-blue-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{lead.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </p>
                      {lead.phone && (
                        <p className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700 line-clamp-1">{lead.subject}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{formatDate(lead.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowStatusDropdown(showStatusDropdown === lead._id ? null : lead._id)
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(lead.status)}`}
                      >
                        {getStatusIcon(lead.status)}
                        <span className="capitalize">{lead.status}</span>
                        {getNextStatuses(lead.status).length > 0 && (
                          <ChevronDown className="w-3 h-3 ml-1" />
                        )}
                      </button>

                      {showStatusDropdown === lead._id &&
                        getNextStatuses(lead.status).length > 0 && (
                          <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-lg shadow-lg border py-1 z-10">
                            {getNextStatuses(lead.status).map((status) => (
                              <button
                                key={status}
                                onClick={() => void handleStatusChange(lead._id, status)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                {getStatusIcon(status)}
                                <span className="capitalize">{status}</span>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          if (lead.status === 'new') {
                            void handleStatusChange(lead._id, 'read');
                          }
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No contact submissions found</p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          )}
        </div>
      </Card>

      {/* Lead Detail Modal */}
      <Modal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title="Message Details"
        size="lg"
      >
        {selectedLead && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Subject</p>
                <p className="font-semibold text-lg text-gray-900">{selectedLead.subject}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(selectedLead.status)}`}
              >
                {getStatusIcon(selectedLead.status)}
                <span className="capitalize">{selectedLead.status}</span>
              </span>
            </div>

            {/* Sender Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Sender</h4>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    {selectedLead.name}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${selectedLead.email}`} className="text-emerald-600 hover:underline">
                      {selectedLead.email}
                    </a>
                  </p>
                  {selectedLead.phone && (
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${selectedLead.phone}`} className="text-emerald-600 hover:underline">
                        {selectedLead.phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Received</h4>
                <p className="text-sm text-gray-600">{formatDate(selectedLead.createdAt)}</p>
              </div>
            </div>

            {/* Message */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Message</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedLead.message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center gap-3 pt-4 border-t">
              <a
                href={`mailto:${selectedLead.email}?subject=Re: ${encodeURIComponent(selectedLead.subject)}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
              >
                <Mail className="w-4 h-4" />
                Reply via Email
              </a>
              <div className="flex gap-2">
                {getNextStatuses(selectedLead.status).map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    onClick={() => void handleStatusChange(selectedLead._id, status)}
                  >
                    Mark as {status}
                  </Button>
                ))}
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
