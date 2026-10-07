// Authentication service for handling API calls
import apiClient from './apiClient';


export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'supervisor';
  profile_picture?: string;
  permissions?: string[];
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  // جديد: إضافة الحقول المطلوبة
  phone?: string;
  nationality?: string;
}

export interface SigninData {
  // تغيير: مفتاح موحد login لقبول البريد أو الهاتف
  login: string; // يمكن أن يكون بريدًا إلكترونيًا أو رقم هاتف كامل مع كود الدولة
  password: string;
}

// Signup function
export const signup = async (data: SignupData): Promise<AuthResponse> => {
  try {
    console.log('[Signup] Preparing request payload', { name: data.name, email: data.email });
    const response = await apiClient.post('/signup', data);
    const result = response.data;

    console.log('[Signup] Parsed response', { user: result.user });

    // Force role to student for signup regardless of backend
    const normalizedUser: User = { ...result.user, role: 'student' };

    // Save token to localStorage (only on client side)
    if (typeof window !== 'undefined') {
      try {
        console.log('[Signup] Storing auth token and user in localStorage');
        const token = (result.access_token ?? (result as any).token) as string | undefined;
        if (token) {
          window.localStorage?.setItem('auth_token', token);
        } else {
          console.warn('[Signup] No token in response (expected access_token or token)');
        }
        window.localStorage?.setItem('user_data', JSON.stringify(normalizedUser));
        console.log('[Signup] Storage complete');
      } catch (e) {
        console.warn('[Signup] localStorage unavailable, skipping persistence', e);
      }
    }

    return { user: normalizedUser, access_token: (result.access_token ?? (result as any).token), token_type: (result.token_type ?? 'Bearer') };
  } catch (error: any) {
    console.log('Signup Error:', error);
    let message = 'فشل في إنشاء الحساب';

    if (error.response) {
      if (error.response.status === 422 && error.response.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        message = errorMessages.join(', ');
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      } else {
        message = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 200)}`;
      }
    }

    throw new Error(message);
  }
};

// Google OAuth authentication
export const googleAuth = (): void => {
  try {
    // Get the backend URL from environment or use default
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    // Redirect to the backend Google OAuth endpoint
    window.location.href = `${backendUrl}/auth/google`;
  } catch (error) {
    console.error('Google Auth Error:', error);
    throw new Error('فشل في تسجيل الدخول عبر Google');
  }
};

// Handle Google OAuth callback (for processing the token from URL)
export const handleGoogleCallback = async (): Promise<AuthResponse | null> => {
  try {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return null;
    }

    // Get token or error from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    // Check for error first
    if (error) {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      throw new Error('فشل في تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
    }

    if (!token) {
      return null;
    }

    // Store the token
    localStorage.setItem('auth_token', token);

    // Get user profile with the token
    const userProfile = await getProfile();

    // Store user data
    localStorage.setItem('user_data', JSON.stringify(userProfile));

    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);

    return {
      user: userProfile,
      access_token: token,
      token_type: 'Bearer'
    };
  } catch (error) {
    console.error('Google Callback Error:', error);
    throw new Error('فشل في معالجة تسجيل الدخول عبر Google');
  }
};

// Upload profile picture
export const uploadProfilePicture = async (file: File): Promise<{ message: string; path: string }> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Create FormData object and append the file
    const formData = new FormData();
    formData.append('profile_picture', file);

    console.log('[UploadProfilePicture] Sending request to /api/profile/picture');
    const response = await apiClient.post('/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = response.data;
    console.log('[UploadProfilePicture] Parsed response', result);

    return result;
  } catch (error: any) {
    console.log('UploadProfilePicture Error:', error);
    let message = 'فشل في رفع صورة الملف الشخصي';

    if (error.response) {
      if (error.response.status === 401) {
        message = 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.';
      } else if (error.response.status === 422) {
        message = 'ملف غير صالح. يرجى اختيار صورة بصيغة JPEG أو PNG أو JPG وحجم أقل من 10MB.';
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      } else {
        message = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 200)}`;
      }
    }

    throw new Error(message);
  }
};

// Signin function
export const signin = async (data: SigninData): Promise<AuthResponse> => {
  try {
    console.log('[Signin] Preparing request payload', { login: data.login });
    const response = await apiClient.post('/login', data);
    const result = response.data;

    console.log('[Signin] Parsed response', { user: result.user });

    // Save token to localStorage (only on client side)
    if (typeof window !== 'undefined') {
      try {
        console.log('[Signin] Storing auth token and user in localStorage');
        const token = (result.access_token ?? (result as any).token) as string | undefined;
        if (token) {
          window.localStorage?.setItem('auth_token', token);
        } else {
          console.warn('[Signin] No token in response (expected access_token or token)');
        }
        window.localStorage?.setItem('user_data', JSON.stringify(result.user));
        console.log('[Signin] Storage complete');
      } catch (e) {
        console.warn('[Signin] localStorage unavailable, skipping persistence', e);
      }
    }

    return result;
  } catch (error: any) {
    console.log('Signin Error:', error);
    let message = 'فشل في تسجيل الدخول';

    if (error.response) {
      if (error.response.data?.message) {
        message = error.response.data.message;
      } else {
        message = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 200)}`;
      }
    }

    throw new Error(message);
  }
};

// Signout function
export const signout = async (): Promise<void> => {
  try {
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        token = window.localStorage?.getItem('auth_token');
      } catch (e) {
        console.warn('[Signout] localStorage unavailable when reading token', e);
        token = null;
      }
    }
    console.log('[Signout] Starting signout. Token exists:', !!token);

    await apiClient.post('/auth/logout');
    console.log('[Signout] Logout successful');

    // Clear localStorage (only on client side)
    if (typeof window !== 'undefined') {
      try {
        console.log('[Signout] Clearing localStorage');
        window.localStorage?.removeItem('auth_token');
        window.localStorage?.removeItem('user_data');
        console.log('[Signout] Storage cleared');
      } catch (e) {
        console.warn('[Signout] localStorage unavailable during clear', e);
      }
    }

  } catch (error: any) {
    console.log('Signout Error:', error);
    // Clear localStorage even if API call fails (only on client side)
    if (typeof window !== 'undefined') {
      try {
        console.log('[Signout] Clearing localStorage on error');
        window.localStorage?.removeItem('auth_token');
        window.localStorage?.removeItem('user_data');
      } catch (e) {
        console.warn('[Signout] localStorage unavailable during clear (error path)', e);
      }
    }

    let message = 'فشل في تسجيل الخروج';
    if (error.response) {
      if (error.response.data?.message) {
        message = error.response.data.message;
      } else {
        message = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 200)}`;
      }
    }

    throw new Error(message);
  }
};

// Get current user from localStorage
export const getCurrentUser = (): User | null => {
  try {
    if (typeof window === 'undefined') return null; // Check if running on client side
    const userData = window.localStorage?.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.log('Get Current User Error:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false; // Check if running on client side
  try {
    const token = window.localStorage?.getItem('auth_token');
    const hasValidToken = !!(token && token !== 'undefined');
    const userData = window.localStorage?.getItem('user_data');
    return !!(hasValidToken && userData);
  } catch (error) {
    console.warn('isAuthenticated: localStorage unavailable', error);
    return false;
  }
};

// Get auth token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null; // Check if running on client side
  try {
    const t = window.localStorage?.getItem('auth_token');
    return t && t !== 'undefined' ? t : null;
  } catch (error) {
    console.warn('getAuthToken: localStorage unavailable', error);
    return null;
  }
};

// Get user profile from API
export const getProfile = async (): Promise<User> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('[GetProfile] Sending request to /profile');
    const response = await apiClient.get('/profile');
    const result = response.data;

    console.log('[GetProfile] Parsed response', { user: result.user });

    // Backend returns { user: { ... } }
    return result.user;
  } catch (error: any) {
    console.log('GetProfile Error:', error);
    let message = 'فشل في جلب بيانات الملف الشخصي';

    if (error.response) {
      if (error.response.status === 401) {
        message = 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.';
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      } else {
        message = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 200)}`;
      }
    }

    throw new Error(message);
  }
};

// Update user profile
export const updateProfile = async (data: { name: string; email?: string; }): Promise<User> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('[UpdateProfile] Sending request to /profile', { name: data.name });
    const response = await apiClient.put('/profile', { name: data.name });
    const result = response.data;

    console.log('[UpdateProfile] Parsed response', { user: result });

    return result;
  } catch (error: any) {
    console.log('UpdateProfile Error:', error);
    let message = 'فشل في تحديث الملف الشخصي';

    if (error.response) {
      if (error.response.status === 401) {
        message = 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.';
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      } else {
        message = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 200)}`;
      }
    }

    throw new Error(message);
  }
};

// Change password for authenticated user
export const changePassword = async (data: { current_password: string; password: string; password_confirmation: string; }): Promise<void> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('[ChangePassword] Sending request to /profile/password');
    await apiClient.post('/profile/password', data);
    console.log('[ChangePassword] Password changed successfully');
  } catch (error: any) {
    console.log('ChangePassword Error:', error);
    let message = 'فشل في تغيير كلمة المرور';
    if (error.response) {
      if (error.response.status === 400) {
        message = error.response.data?.message || 'كلمة المرور الحالية غير صحيحة';
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      } else {
        message = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 200)}`;
      }
    }
    throw new Error(message);
  }
};