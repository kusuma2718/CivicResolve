import { useEffect, useState, useCallback } from 'react';
import { complaintStore } from '../services/complaintStore';
import { ApiService } from '../services/api';
import { Complaint, ComplaintStatus, NewComplaintInput } from '../types';

export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>(() => complaintStore.getAllComplaints());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshComplaints = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getComplaints();
      if (data && data.length > 0) {
        setComplaints(data);
      }
    } catch {
      setComplaints(complaintStore.getAllComplaints());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch from backend
    refreshComplaints();

    // Subscribe to any local store updates
    const unsubscribe = complaintStore.subscribe(() => {
      setComplaints(complaintStore.getAllComplaints());
    });
    return () => {
      unsubscribe();
    };
  }, [refreshComplaints]);

  const addComplaint = async (input: NewComplaintInput): Promise<Complaint> => {
    const created = await ApiService.createComplaint(input);
    await refreshComplaints();
    return created;
  };

  const getComplaintById = (id: string): Complaint | undefined => {
    // Return from current complaints cache or local store
    const found = complaints.find((c) => c.id.toLowerCase() === id.toLowerCase());
    return found || complaintStore.getComplaintById(id);
  };

  const fetchComplaintById = async (id: string): Promise<Complaint | undefined> => {
    return await ApiService.getComplaintById(id);
  };

  const updateStatus = async (
    id: string,
    newStatus: ComplaintStatus,
    actor?: string,
    notes?: string
  ): Promise<boolean> => {
    const result = await ApiService.updateStatus(id, newStatus, actor, notes);
    await refreshComplaints();
    return result;
  };

  const resetComplaints = () => {
    complaintStore.resetToDefaults();
    setComplaints(complaintStore.getAllComplaints());
  };

  return {
    complaints,
    isLoading,
    refreshComplaints,
    addComplaint,
    getComplaintById,
    fetchComplaintById,
    updateStatus,
    resetComplaints,
  };
}
