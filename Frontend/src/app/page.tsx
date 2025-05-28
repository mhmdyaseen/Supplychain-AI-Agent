'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import coverimage from './cover-image.png';
import { useState } from 'react';
import { usePlaygroundStore } from '@/store'

// 
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
    
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        body: formData,
      });
    
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Login failed');
      }
    
      const data = await response.json();
      localStorage.setItem('token', data.access_token);
    
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
    
  }
    

  return (
    <div className="flex min-h-screen">
      {/* Left side: Login form */}
      <div className="flex-1 flex flex-col justify-center items-start p-16 bg-white">
        <h1 className="text-5xl font-bold mb-10 text-black">SuperAgent</h1>

        <form className="w-full max-w-md" onSubmit={handleSubmit}>
          <label className="block mb-2 text-lg text-black" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Enter your username"
            className="w-full p-3 border border-gray-300 rounded-[17px] mb-6 text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />

          <label className="block mb-2 text-lg text-black" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            className="w-full p-3 border border-gray-300 rounded-[17px] mb-6 text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />

          <label className="block mb-2 text-lg text-black" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-[17px] text-gray-400 mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">Select your role</option>
            <option value="manager">Manager</option>
            <option value="operations">Operations</option>
            <option value="finance">Finance</option>
            <option value="planner">Planner</option>
          </select>

        {error && <p className="text-red-500 mb-6 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#c9d651] text-white py-3 rounded-[17px] hover:bg-[#c9d651]/80 transition"
          >
            Login
          </button>
          
        </form>
      </div>
      {/* Right side: Login form */}
      <div className="flex-1 relative">
        <Image
          src={coverimage}
          alt="Placeholder"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}