'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackSignup } from '@/lib/gtag';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryId: ''
  });
  
  const [countries, setCountries] = useState<any[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Load countries for dropdown
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/admin/countries');
        if (response.ok) {
          const data = await response.json();
          setCountries(data);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };
    
    fetchCountries();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Form submit triggered');
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Form data:', { ...formData, password: '[REDACTED]', confirmPassword: '[REDACTED]' });

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      console.log('Password validation failed');
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    // Validate country selection
    if (!formData.countryId) {
      setError('Please select your country');
      setLoading(false);
      return;
    }

    try {
      console.log('Making API request to /api/auth/register');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          countryId: parseInt(formData.countryId)
        }),
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('Registration successful');
      
      // Track successful signup
      trackSignup();
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2 sm:px-3 lg:px-4">
        <div className="max-w-md w-full space-y-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
              <p className="text-sm text-gray-600 mb-3">
                We've sent a verification email to <strong>{formData.email}</strong>.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Please check your inbox and click the verification link to activate your account.
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-xl">
        {/* Logo/Icon */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg className="h-24 w-24 text-blue-600" viewBox="0 0 841.42 831.11" xmlns="http://www.w3.org/2000/svg">
              <g fill="currentColor">
                <path d="M433.58,405.96c5.09,7.11,3.61,17.05-3.4,22.3-4.12,3.13-9.61,4.04-14.53,2.45-6.88-2.18-11.48-8.94-10.97-16.13.31-4.68,2.72-9.02,6.54-11.74-4.39,3.23-6.79,8.61-6.26,14.04.75,7.89,7.4,13.96,15.32,13.97,3.38.01,6.76-1.13,9.41-3.22,3.89-2.99,6.1-7.81,5.86-12.71-.07-1.39-.33-2.77-.77-4.09-.5-1.49-1.25-2.9-2.17-4.17-.46-.66.47-1.35.97-.7h0Z"/>
                <path d="M438.55,415.34c-.07,9.71-7.89,17.69-17.62,17.83-5.75.13-11.28-2.64-14.66-7.28-4.75-6.45-4.48-15.53.68-21.66,3.34-4,8.33-6.33,13.54-6.28-6.06.04-11.73,3.3-14.8,8.53-4.47,7.58-2.47,17.38,4.64,22.56,3.03,2.22,6.81,3.39,10.57,3.25,5.45-.15,10.58-3.04,13.57-7.6.84-1.29,1.52-2.7,1.98-4.18.53-1.66.77-3.42.77-5.17.02-.89,1.3-.9,1.33,0h0Z"/>
                <path d="M436.89,427.01c-6.41,8.69-18.65,10.74-27.49,4.52-5.25-3.64-8.41-9.74-8.42-16.12-.06-8.91,6.11-16.89,14.76-19.03,5.61-1.42,11.62-.25,16.28,3.2-5.47-3.93-12.7-4.69-18.87-2-8.97,3.89-13.57,14.01-10.56,23.31,1.28,3.97,3.91,7.5,7.38,9.82,5,3.43,11.5,4.18,17.16,2.03,1.6-.61,3.13-1.44,4.51-2.46,1.56-1.15,2.93-2.57,4.07-4.14.6-.79,1.76.04,1.19.87h0Z"/>
                <path d="M427.77,436.41c-11.43,3.62-23.78-2.52-27.66-13.89-2.34-6.7-1.2-14.25,2.96-19.99,5.76-8.04,16.52-11.19,25.69-7.47,5.97,2.39,10.61,7.37,12.54,13.51-2.36-7.1-8.35-12.51-15.66-14.12-10.61-2.36-21.34,3.73-24.72,14.06-1.45,4.41-1.38,9.29.22,13.65,2.25,6.35,7.61,11.26,14.1,13.03,1.84.5,3.76.75,5.66.73,2.16-.01,4.31-.4,6.36-1.07,1.05-.32,1.56,1.18.51,1.56h0Z"/>
                <path d="M413.44,438.92c-12.64-4.21-19.73-17.79-15.79-30.55,2.27-7.55,8.22-13.6,15.72-16.04,10.44-3.47,22.16.73,27.97,10.07,3.81,6.05,4.73,13.55,2.45,20.33,2.52-7.93.66-16.7-4.85-22.92-7.99-9.05-21.62-10.58-31.4-3.5-4.18,3.02-7.31,7.45-8.72,12.41-2.12,7.18-.52,15.09,4.16,20.92,1.33,1.65,2.89,3.13,4.61,4.35,1.95,1.39,4.14,2.46,6.41,3.19,1.15.4.63,2.08-.56,1.73h0Z"/>
                <path d="M398.92,431.8c-8.62-12.04-6.11-28.88,5.75-37.77,6.97-5.3,16.27-6.85,24.6-4.15,11.64,3.7,19.44,15.13,18.57,27.32-.53,7.92-4.6,15.27-11.07,19.88,7.44-5.48,11.5-14.57,10.61-23.77-1.27-13.35-12.53-23.64-25.94-23.66-5.73-.02-11.44,1.92-15.94,5.46-6.59,5.06-10.32,13.23-9.92,21.52.12,2.35.55,4.7,1.3,6.92.84,2.53,2.11,4.91,3.68,7.06.78,1.11-.8,2.28-1.63,1.19h0Z"/>
                <path d="M390.51,415.93c.12-16.45,13.37-29.95,29.84-30.2,9.73-.21,19.1,4.47,24.83,12.33,8.05,10.93,7.59,26.3-1.15,36.69-5.65,6.78-14.11,10.72-22.94,10.64,10.27-.06,19.86-5.59,25.06-14.44,7.58-12.84,4.18-29.43-7.87-38.2-5.14-3.76-11.54-5.74-17.9-5.5-9.23.25-17.92,5.15-22.97,12.87-1.43,2.19-2.57,4.58-3.35,7.07-.89,2.82-1.31,5.79-1.3,8.75-.03,1.51-2.21,1.53-2.25,0h0Z"/>
                <path d="M393.32,396.16c10.85-14.71,31.58-18.2,46.55-7.65,8.89,6.17,14.25,16.49,14.26,27.3.1,15.08-10.35,28.6-24.99,32.23-9.5,2.4-19.69.42-27.56-5.42,9.27,6.65,21.5,7.94,31.96,3.39,15.19-6.59,22.97-23.72,17.88-39.48-2.16-6.73-6.62-12.7-12.49-16.64-8.46-5.81-19.47-7.07-29.06-3.44-2.71,1.03-5.31,2.44-7.64,4.17-2.64,1.95-4.96,4.35-6.88,7.01-1.01,1.34-2.98-.06-2.02-1.47h0Z"/>
                <path d="M408.75,380.24c19.36-6.14,40.27,4.27,46.84,23.52,3.96,11.35,2.04,24.13-5.01,33.86-9.76,13.62-27.98,18.95-43.51,12.65-10.11-4.05-17.97-12.48-21.24-22.87,3.99,12.03,14.14,21.18,26.52,23.92,17.96,4,36.15-6.32,41.86-23.81,2.45-7.46,2.34-15.74-.37-23.11-3.81-10.75-12.88-19.08-23.87-22.07-3.11-.84-6.36-1.27-9.59-1.24-3.65.02-7.3.67-10.77,1.81-1.78.54-2.64-2.01-.86-2.64h0Z"/>
                <path d="M433.03,376c21.41,7.13,33.41,30.13,26.75,51.73-3.85,12.79-13.93,23.02-26.61,27.16-17.67,5.87-37.53-1.24-47.37-17.05-6.44-10.24-8-22.95-4.16-34.43-4.27,13.42-1.12,28.27,8.22,38.82,13.53,15.33,36.62,17.92,53.18,5.93,7.08-5.11,12.39-12.62,14.77-21.02,3.59-12.15.88-25.56-7.05-35.43-2.25-2.79-4.89-5.3-7.81-7.37-3.3-2.36-7-4.17-10.86-5.41-1.95-.67-1.06-3.53.95-2.93h0Z"/>
                <path d="M457.62,388.04c14.59,20.39,10.35,48.91-9.75,63.97-11.81,8.98-27.56,11.6-41.66,7.03-19.72-6.27-32.92-25.63-31.45-46.27.9-13.42,7.8-25.86,18.75-33.67-12.6,9.28-19.48,24.68-17.96,40.26,2.16,22.61,21.21,40.03,43.93,40.06,9.7.03,19.37-3.25,27-9.25,11.16-8.58,17.48-22.4,16.8-36.45-.2-3.98-.93-7.95-2.2-11.73-1.42-4.28-3.57-8.32-6.23-11.95-1.31-1.88,1.35-3.86,2.77-2.01h0Z"/>
                <path d="M471.86,414.93c-.2,27.86-22.64,50.73-50.54,51.14-16.48.36-32.35-7.57-42.04-20.89-13.63-18.51-12.86-44.54,1.95-62.13,9.57-11.47,23.9-18.15,38.84-18.02-17.39.11-33.63,9.47-42.44,24.46-12.83,21.74-7.07,49.84,13.32,64.7,8.7,6.36,19.54,9.73,30.31,9.32,15.64-.42,30.35-8.72,38.91-21.79,2.42-3.7,4.36-7.76,5.68-11.98,1.52-4.77,2.22-9.81,2.21-14.81.05-2.55,3.74-2.59,3.8,0h0Z"/>
                <path d="M467.1,448.4c-18.37,24.91-53.48,30.81-78.83,12.96-15.05-10.44-24.13-27.93-24.15-46.23-.17-25.54,17.53-48.43,42.33-54.57,16.09-4.07,33.34-.71,46.68,9.17-15.7-11.26-36.41-13.45-54.12-5.73-25.73,11.16-38.91,40.18-30.28,66.86,3.66,11.4,11.21,21.51,21.16,28.17,14.33,9.84,32.97,11.98,49.21,5.82,4.59-1.75,8.98-4.13,12.93-7.06,4.48-3.3,8.4-7.37,11.66-11.87,1.71-2.26,5.05.11,3.42,2.48h0Z"/>
                <path d="M440.96,475.37c-32.78,10.39-68.2-7.23-79.32-39.83-6.71-19.22-3.45-40.87,8.48-57.33,16.53-23.07,47.39-32.09,73.69-21.42,17.12,6.86,30.43,21.13,35.97,38.73-6.76-20.38-23.94-35.87-44.91-40.5-30.42-6.77-61.21,10.71-70.88,40.32-4.15,12.64-3.97,26.66.62,39.15,6.46,18.2,21.82,32.3,40.43,37.37,5.27,1.43,10.77,2.16,16.23,2.1,6.18-.04,12.37-1.14,18.24-3.06,3.01-.92,4.47,3.4,1.45,4.47h0Z"/>
                <path d="M399.85,482.55c-36.26-12.07-56.58-51.03-45.29-87.61,6.52-21.65,23.59-38.99,45.07-46,29.93-9.94,63.56,2.11,80.23,28.88,10.91,17.35,13.55,38.87,7.04,58.31,7.23-22.73,1.9-47.88-13.92-65.73-22.92-25.96-62.02-30.35-90.05-10.04-11.99,8.65-20.98,21.37-25.01,35.59-6.08,20.58-1.49,43.29,11.94,60,3.8,4.73,8.27,8.97,13.22,12.49,5.59,4,11.86,7.06,18.39,9.16,3.31,1.14,1.8,5.97-1.61,4.96h0Z"/>
                <path d="M358.2,462.15c-24.71-34.53-17.53-82.83,16.5-108.33,20-15.21,46.67-19.64,70.56-11.91,33.39,10.61,55.76,43.4,53.26,78.35-1.52,22.72-13.2,43.79-31.76,57.01,21.34-15.71,32.98-41.8,30.42-68.18-3.65-38.3-35.92-67.79-74.39-67.84-16.42-.05-32.81,5.51-45.73,15.66-18.91,14.52-29.61,37.94-28.46,61.73.33,6.73,1.58,13.47,3.73,19.86,2.41,7.24,6.05,14.09,10.55,20.24,2.23,3.19-2.28,6.54-4.69,3.41h0Z"/>
                <path d="M334.09,416.62c.34-47.18,38.33-85.9,85.59-86.6,27.91-.61,54.78,12.82,71.2,35.37,23.09,31.35,21.77,75.43-3.3,105.21-16.2,19.43-40.47,30.75-65.78,30.51,29.45-.18,56.95-16.03,71.87-41.42,21.73-36.81,11.98-84.4-22.56-109.57-14.73-10.78-33.09-16.48-51.33-15.79-26.48.71-51.39,14.77-65.89,36.9-4.1,6.27-7.38,13.14-9.62,20.29-2.57,8.08-3.76,16.62-3.74,25.09-.08,4.32-6.33,4.39-6.44,0h0Z"/>
                <path d="M342.15,359.94c31.12-42.18,90.56-52.19,133.5-21.95,25.49,17.68,40.87,47.3,40.9,78.3.28,43.26-29.69,82.02-71.68,92.42-27.26,6.89-56.46,1.21-79.05-15.53,26.59,19.07,61.66,22.78,91.66,9.71,43.58-18.9,65.89-68.04,51.28-113.23-6.2-19.31-18.99-36.42-35.83-47.71-24.27-16.66-55.84-20.29-83.33-9.86-7.78,2.96-15.21,6.99-21.9,11.95-7.59,5.59-14.23,12.48-19.75,20.11-2.89,3.83-8.56-.19-5.79-4.21h0Z"/>
                <path d="M386.42,314.26c55.52-17.6,115.49,12.24,134.34,67.45,11.36,32.54,5.84,69.21-14.37,97.1-28,39.07-80.26,54.34-124.79,36.27-29-11.61-51.54-35.79-60.92-65.59,11.45,34.51,40.55,60.75,76.05,68.59,51.51,11.47,103.67-18.13,120.04-68.29,7.03-21.4,6.72-45.14-1.05-66.29-10.93-30.82-36.94-54.71-68.47-63.29-8.93-2.42-18.24-3.65-27.49-3.56-10.47.07-20.94,1.92-30.88,5.18-5.1,1.55-7.57-5.76-2.46-7.56h0Z"/>
                <path d="M456.04,302.1c61.4,20.44,95.82,86.43,76.7,148.37-11.04,36.67-39.95,66.03-76.33,77.9-50.68,16.83-107.64-3.57-135.86-48.9-18.48-29.38-22.96-65.83-11.92-98.75-12.25,38.49-3.23,81.09,23.57,111.32,38.81,43.96,105.03,51.41,152.51,17.01,20.3-14.65,35.52-36.19,42.35-60.28,10.3-34.85,2.52-73.31-20.21-101.61-6.44-8.01-14.01-15.2-22.39-21.15-9.46-6.77-20.08-11.95-31.14-15.51-5.6-1.94-3.04-10.12,2.73-8.40h0Z"/>
                <path d="M526.57,336.64c41.84,58.48,29.69,140.27-27.95,183.46-33.87,25.76-79.03,33.27-119.49,20.17-56.55-17.97-94.42-73.5-90.19-132.69,2.57-38.48,22.36-74.17,53.78-96.55-36.15,26.6-55.86,70.79-51.52,115.46,6.18,64.86,60.84,114.8,125.98,114.89,27.81.09,55.56-9.33,77.44-26.52,32.02-24.6,50.14-64.25,48.19-104.54-.56-11.41-2.67-22.81-6.31-33.63-4.08-12.27-10.25-23.86-17.86-34.29-3.77-5.4,3.87-11.08,7.94-5.77h0Z"/>
                <path d="M567.4,413.76c-.58,79.89-64.92,145.48-144.94,146.66-47.27,1.03-92.77-21.71-120.58-59.9-39.1-53.09-36.87-127.74,5.58-178.18,27.44-32.91,68.54-52.07,111.4-51.67-49.87.31-96.44,27.15-121.72,70.14-36.8,62.34-20.29,142.93,38.21,185.55,24.94,18.25,56.04,27.9,86.93,26.73,44.85-1.2,87.03-25.01,111.59-62.5,6.94-10.62,12.5-22.25,16.29-34.35,4.35-13.69,6.37-28.14,6.33-42.49.14-7.32,10.72-7.43,10.91,0h0Z"/>
                <path d="M553.75,509.74c-52.7,71.44-153.37,88.38-226.07,37.17-43.16-29.95-69.21-80.1-69.27-132.6-.47-73.26,50.28-138.91,121.39-156.52,46.16-11.66,95.61-2.04,133.88,26.31-45.03-32.29-104.42-38.58-155.22-16.44-73.8,32-111.59,115.23-86.84,191.75,10.5,32.69,32.15,61.68,60.68,80.8,41.1,28.21,94.57,34.36,141.13,16.7,13.18-5.01,25.77-11.84,37.08-20.24,12.85-9.47,24.1-21.13,33.44-34.06,4.9-6.49,14.49.32,9.8,7.12h0Z"/>
                <path d="M478.79,587.11c-94.02,29.8-195.58-20.72-227.5-114.23-19.24-55.11-9.9-117.2,24.33-164.43,47.42-66.16,135.92-92.03,211.34-61.42,49.11,19.67,87.28,60.61,103.16,111.09-19.39-58.44-68.67-102.88-128.79-116.15-87.24-19.43-175.56,30.71-203.29,115.65-11.91,36.25-11.38,76.45,1.78,112.27,18.52,52.2,62.57,92.65,115.95,107.18,15.12,4.1,30.89,6.19,46.55,6.02,17.73-.12,35.47-3.26,52.3-8.77,8.64-2.63,12.82,9.75,4.16,12.8h0Z"/>
                <path d="M360.88,607.7c-103.98-34.62-162.28-146.36-129.9-251.26,18.69-62.1,67.65-111.82,129.26-131.92,85.84-28.5,182.28,6.04,230.09,82.81,31.3,49.75,38.87,111.48,20.19,167.23,20.74-65.19,5.46-137.33-39.91-188.52-65.73-74.44-177.87-87.06-258.27-28.81-34.38,24.81-60.16,61.28-71.73,102.08-17.45,59.02-4.27,124.14,34.23,172.07,10.91,13.56,23.73,25.74,37.91,35.82,16.02,11.47,34.01,20.24,52.74,26.27,9.49,3.28,5.16,17.13-4.62,14.23h0Z"/>
                <path d="M241.44,549.2c-70.86-99.03-50.28-237.55,47.33-310.7,57.36-43.62,133.84-56.34,202.35-34.16,95.77,30.44,159.91,124.48,152.74,224.71-4.35,65.16-37.86,125.6-91.07,163.51,61.22-45.05,94.6-119.88,87.25-195.53-10.47-109.84-103.03-194.42-213.35-194.57-47.1-.15-94.1,15.8-131.14,44.92-54.23,41.65-84.91,108.81-81.61,177.03.95,19.31,4.52,38.63,10.69,56.96,6.91,20.77,17.36,40.4,30.25,58.06,6.39,9.15-6.55,18.77-13.45,9.77h0Z"/>
                <path d="M172.29,418.61c.98-135.3,109.94-246.37,245.46-248.37,80.05-1.74,157.1,36.77,204.21,101.45,66.21,89.91,62.45,216.33-9.46,301.75-46.47,55.73-116.07,88.18-188.65,87.5,84.45-.52,163.33-45.98,206.13-118.78,62.33-105.57,34.36-242.05-64.7-314.24-42.24-30.9-94.91-47.25-147.22-45.27-75.95,2.03-147.39,42.35-188.98,105.84-11.76,17.98-21.17,37.68-27.59,58.18-7.36,23.18-10.79,47.65-10.72,71.95-.23,12.39-18.15,12.59-18.47,0h0Z"/>
                <path d="M195.41,256.05c89.24-120.98,259.73-149.67,382.86-62.96,73.1,50.71,117.21,135.65,117.31,224.56.8,124.06-85.15,235.24-205.57,265.07-78.17,19.75-161.92,3.46-226.73-44.55,76.25,54.69,176.84,65.34,262.87,27.85,124.98-54.2,188.97-195.14,147.06-324.73-17.79-55.37-54.45-104.46-102.77-136.84-69.6-47.78-160.15-58.19-239-28.28-22.32,8.48-43.63,20.05-62.8,34.28-21.76,16.03-40.82,35.79-56.63,57.67-8.3,10.99-24.54-.53-16.6-12.06h0Z"/>
                <path d="M322.36,125.03c159.23-50.47,331.22,35.09,385.27,193.45,32.59,93.33,16.76,198.49-41.21,278.47-80.3,112.05-230.18,155.85-357.91,104.01-83.17-33.3-147.81-102.64-174.71-188.12,32.83,98.96,116.29,174.23,218.11,196.71,147.74,32.9,297.31-52,344.27-195.86,20.17-61.39,19.28-129.46-3.01-190.13-31.36-88.4-105.96-156.9-196.37-181.51-25.6-6.95-52.32-10.48-78.84-10.2-30.03.2-60.07,5.51-88.57,14.86-14.64,4.46-21.71-16.51-7.05-21.68h0Z"/>
                <path d="M522.04,90.17c176.09,58.63,274.82,247.86,219.98,425.51-31.66,105.17-114.56,189.37-218.91,223.41-145.36,48.27-308.7-10.23-389.66-140.25-53.01-84.25-65.83-188.8-34.19-283.21-35.12,110.4-9.25,232.56,67.59,319.26,111.31,126.06,301.22,147.43,437.38,48.79,58.22-42.01,101.88-103.78,121.47-172.87,29.55-99.94,7.23-210.24-57.97-291.41-18.48-22.97-40.19-43.59-64.21-60.66-27.12-19.43-57.6-34.27-89.32-44.49-16.07-5.56-8.73-29.01,7.83-24.09h0Z"/>
                <path d="M724.31,189.24c120,167.71,85.16,402.29-80.16,526.17-97.14,73.87-226.66,95.41-342.68,57.85C139.27,721.71,30.66,562.45,42.79,392.71c7.37-110.36,64.12-212.71,154.23-276.9C93.36,192.1,36.83,318.81,49.27,446.93c17.73,186.02,174.48,329.25,361.3,329.51,79.77.26,159.36-26.76,222.09-76.07,91.83-70.54,143.8-184.27,138.2-299.81-1.61-32.71-7.66-65.42-18.1-96.46-11.7-35.18-29.39-68.42-51.24-98.33-10.82-15.49,11.1-31.78,22.77-16.55h0Z"/>
                <path d="M841.42,410.39c-1.65,229.13-186.18,417.24-415.69,420.63-135.57,2.95-266.05-62.27-345.82-171.8C-32.23,506.96-25.85,292.86,95.92,148.2,174.62,53.82,292.48-1.12,415.41.02,272.39.9,138.82,77.88,66.33,201.18c-105.55,178.79-58.19,409.92,109.58,532.16,71.54,52.33,160.73,80.02,249.31,76.67,128.62-3.43,249.6-71.72,320.04-179.24,19.92-30.45,35.85-63.81,46.72-98.53,12.46-39.26,18.27-80.7,18.16-121.85.39-20.99,30.73-21.32,31.28,0h0Z"/>
              </g>
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 font-quicksand">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-quicksand">
            Or{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="countryId" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                id="countryId"
                name="countryId"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={formData.countryId}
                onChange={handleChange}
                disabled={loadingCountries}
              >
                <option value="">Select your country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              {loadingCountries && (
                <p className="text-xs text-gray-500 mt-1">Loading countries...</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600">
              By signing up, you agree to our{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}