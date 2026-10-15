// src/hooks/useEditStudent.ts
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentById, updateStudentProfile } from '../services';
import type { StudentDetails, StudentProfileFormData } from '../types/student';
import type { User } from '../types/user';

interface EditStudentState {
  user: StudentDetails | null;
  profile: StudentProfileFormData;
  fetchLoading: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useEditStudent = () => {
  const auth = useAuth();
  const { id: _id } = useParams<{ id: string }>();

  const [state, setState] = useState<EditStudentState>({
    user: null,
    profile: {
      name: '',
      email: '',
      phone: '',
      class: '',
      address: '',
    },
    fetchLoading: true,
    isLoading: false,
    error: null,
  });

  const getAuthToken = useCallback(() => {
    return auth?.token || localStorage.getItem('token');
  }, [auth?.token]);

  const handleError = useCallback((error: unknown, context: 'fetch' | 'update') => {
    let errorMessage = '';

    if (error instanceof Error) {
      const message = error.message;

      if (message.includes('401') || message.includes('unauthorized')) {
        errorMessage = context === 'fetch' 
          ? 'Session expired. Please login again.' 
          : 'Session expired. Please login again.';
        auth?.logout?.();
        localStorage.removeItem('token');
      } else if (message.includes('404')) {
        errorMessage = context === 'fetch' 
          ? 'Student not found. The student may have been deleted or the ID is invalid.'
          : 'Student not found. Unable to update profile.';
      } else if (message.includes('403')) {
        errorMessage = context === 'fetch'
          ? 'Access denied. You do not have permission to view this student.'
          : 'Access denied. You do not have permission to update this student.';
      } else {
        errorMessage = message || (context === 'fetch' ? 'Failed to fetch student data' : 'Failed to update profile');
      }
    } else {
      errorMessage = context === 'fetch' 
        ? 'An unexpected error occurred while fetching student data'
        : 'An unexpected error occurred while updating profile';
    }

    setState(prev => ({ ...prev, error: errorMessage }));
  }, [auth]);

  const fetchStudentData = useCallback(async () => {
    if (!_id) {
      setState(prev => ({ 
        ...prev, 
        error: 'Student ID is missing from URL parameters',
        fetchLoading: false 
      }));
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setState(prev => ({ 
        ...prev, 
        error: 'Authentication required. Please login to continue.',
        fetchLoading: false 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, fetchLoading: true, error: null }));

      const studentData = await getStudentById(_id);

      // IMPORTANT: Check if studentData exists
      if (!studentData) {
        setState(prev => ({
          ...prev,
          user: null,
          fetchLoading: false,
          error: 'Student not found'
        }));
        return;
      }

      // Now studentData is guaranteed to exist
      setState(prev => ({
        ...prev,
        user: studentData, // studentData is StudentDetails, not undefined
        profile: {
          name: studentData.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
          class: studentData.academicDetails?.classAdmittedTo || studentData.class || '',
          email: studentData.email || '',
          phone: studentData.phone || '',
          address: studentData.address || '',
        },
        fetchLoading: false,
      }));

    } catch (error) {
      handleError(error, 'fetch');
      setState(prev => ({ ...prev, fetchLoading: false }));
    }
  }, [_id, getAuthToken, handleError]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!_id) {
      setState(prev => ({ ...prev, error: 'Missing student ID' }));
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setState(prev => ({ ...prev, error: 'Authentication required. Please login to continue.' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const trimmedProfile: StudentProfileFormData = {
      name: state.profile.name.trim(),
      email: state.profile.email.trim(),
      phone: state.profile.phone.trim(),
      address: state.profile.address.trim(),
      class: state.profile.class.trim(),
    };

    // Validation
    if (!trimmedProfile.name) {
      setState(prev => ({ ...prev, error: 'Name is required', isLoading: false }));
      return;
    }

    if (!trimmedProfile.email) {
      setState(prev => ({ ...prev, error: 'Email is required', isLoading: false }));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedProfile.email)) {
      setState(prev => ({ ...prev, error: 'Please enter a valid email address', isLoading: false }));
      return;
    }

    try {
      const result = await updateStudentProfile(_id, trimmedProfile);

      if (result.message) {
        if (result.data) {
          setState(prev => ({ ...prev, user: result.data ?? null }));
        } else {
          const updatedData = { ...state.user, ...trimmedProfile } as StudentDetails;
          setState(prev => ({ ...prev, user: updatedData }));
        }

        setState(prev => ({ ...prev, profile: trimmedProfile }));

        // Update auth context if editing current user
        if (auth?.user?._id === _id && state.user) {
          const updatedUserData = result.data || { ...state.user, ...trimmedProfile };
          const userWithRole: User = {
            ...auth.user,
            _id: _id,
            name: updatedUserData.name || '',
            email: updatedUserData.email || '',
            role: state.user.role ?? 'student',
            status: state.user.status || 'Active',
            createdAt: state.user.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            firstName: state.user.firstName,
            lastName: state.user.lastName,
            phone: updatedUserData.phone,
          };
          auth?.login?.(userWithRole, token);
        }

        alert('Profile updated successfully!');
      }
    } catch (error) {
      handleError(error, 'update');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleRetry = () => {
    fetchStudentData();
  };

  const handleProfileChange = (field: keyof StudentProfileFormData, value: string) => {
    setState(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  // Initial fetch
  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  return {
    user: state.user,
    profile: state.profile,
    fetchLoading: state.fetchLoading,
    isLoading: state.isLoading,
    error: state.error,
    _id,
    handleProfileChange,
    handleProfileUpdate,
    handleRetry,
    auth,
  };
};