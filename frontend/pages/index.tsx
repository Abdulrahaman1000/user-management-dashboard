import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import api from "../services/api";

// Type definitions to resolve TypeScript issues
interface LoginError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);
  const router = useRouter();

  // Remove splash screen after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplashScreen(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validateForm = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return false;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);

      setSuccess("Login successful!");
      setError("");
      setIsLoading(false);

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      const error = err as LoginError;
      const errorMessage = error.response?.data?.message || 
                           (error instanceof Error ? error.message : "Invalid credentials");
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Logos for technologies
  const TechLogos = () => (
    <div className="flex items-center justify-center space-x-6 mt-6">
      {/* Next.js Logo */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="80" 
        height="80" 
        viewBox="0 0 207 124"
        className="fill-white"
      >
        <path d="M48.8739 27.9224C55.6440 20.3459 62.4140 12.7693 69.1841 5.19287C76.4928 12.9813 83.8015 20.7697 91.1102 28.5582C98.4190 36.3466 105.728 44.1351 113.037 51.9235L143.174 5.19287H175.262L120.346 80.4514L175.711 124H143.623L91.1102 72.0989L69.1841 95.4807V124H48.8739V5.19287H69.1841V27.9224H48.8739Z" />
        <path d="M189.059 5.19287H206.406V124H189.059V5.19287Z" />
      </svg>

      {/* TypeScript Logo */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="80" 
        height="80" 
        viewBox="0 0 400 400"
      >
        <rect width="400" height="400" fill="#3178C6" />
        <path 
          d="M232.5 213.5V197H170V213.5H195V302H214.5V213.5H232.5Z" 
          fill="white"
        />
        <path 
          d="M255 302V213.5H235.5V302H255ZM245.25 197C248.75 197 251.625 194.125 251.625 190.625C251.625 187.125 248.75 184.25 245.25 184.25C241.75 184.25 238.875 187.125 238.875 190.625C238.875 194.125 241.75 197 245.25 197Z" 
          fill="white"
        />
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M150 200C150 185.25 162.25 174 178.25 174C191.75 174 203.25 183.5 206.5 197H187.25C185.125 191.875 180.625 188.5 178.25 188.5C174.875 188.5 172.5 191 172.5 194.25C172.5 196.875 174.5 198.375 178.25 199.25L194 202.625C206.25 205.5 212.5 211.75 212.5 222.625C212.5 238.25 200.5 249 180.875 249C165.125 249 152.875 239.625 150 225H169.25C171.375 231.125 176.125 234.5 180.875 234.5C184.875 234.5 187.5 232 187.5 228.75C187.5 226.125 185.625 224.625 181.875 223.75L166.125 220.375C153.875 217.5 150 211.25 150 200Z" 
          fill="white"
        />
      </svg>

      {/* Node.js Logo */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="80" 
        height="80" 
        viewBox="0 0 256 282"
      >
        <g fill="#8CC84B">
          <path d="M116.553 3.8537c-7.9912-4.5922-17.9082-4.5922-25.8994 0L9.48337 59.5696C1.56133 64.1618-2.4003 72.8782 1.00271 80.7932L45.9621 206.357c3.40301 7.915 11.0282 12.7462 19.4184 12.7462h125.919c8.3902 0 16.0153-4.8312 19.4184-12.7462l44.9593-125.5648c3.4031-7.915-0.5585-16.6314-8.4806-21.2236L140.452 3.8537c-7.9912-4.5922-17.9082-4.5922-25.8994 0z" />
          <path d="M208.667 90.3909l-2.0724 5.3415c-2.8065 7.2112-9.7337 12.0228-17.4203 12.0228H67.3297c-9.3902 0-17.4203-7.2112-17.4203-16.8387V82.5439c0-9.6275 8.0301-16.8387 17.4203-16.8387h122.0125c3.1424 0 5.9489 1.6745 7.4253 4.3556 3.4031 6.086 1.0093 14.1086-3.9008 20.3301z" fill="#FFFFFF" />
        </g>
      </svg>

      {/* Express.js Logo */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="80" 
        height="80" 
        viewBox="0 0 256 256"
      >
        <g fill="#333">
          <path d="M96.25 160.41H127.86C140.39 160.41 148.69 152.51 148.69 139.98V117.12H120.24C107.71 117.12 96.25 128.57 96.25 141.11V160.41ZM96.25 64.88V89.48H127.86C140.39 89.48 148.69 81.58 148.69 69.05V46.19H120.24C107.71 46.19 96.25 57.64 96.25 70.18V64.88ZM148.69 33.81V59.18C148.69 71.71 140.79 79.61 127.86 79.61H96.25V32.36H49V223.64H96.25V160.41H127.86C140.79 160.41 148.69 168.31 148.69 180.84V223.64H208.07V33.81H148.69Z" />
        </g>
      </svg>

      {/* MongoDB Logo */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="80" 
        height="80" 
        viewBox="0 0 256 256"
      >
        <path 
          d="M128 16.512L89.408 55.104C78.72 65.792 73.28 79.36 73.28 93.44c0 14.08 5.44 27.648 16.128 38.336l38.592 38.592V16.512zm45.248 77.76l-45.248 45.248v100.352l45.248-45.248c10.688-10.688 16.128-24.768 16.128-38.336 0-14.08-5.44-28.16-16.128-38.336zm-61.696 16.128l-38.592-38.592C62.272 79.872 56.832 93.44 56.832 107.52c0 14.08 5.44 27.648 16.128 38.336l38.592 38.592V110.4zm7.68 107.52l38.592 38.592c10.688-10.688 16.128-24.256 16.128-38.336 0-14.08-5.44-28.16-16.128-38.336l-38.592-38.592v114.336z" 
          fill="#589636"
        />
      </svg>
    </div>
  );

  // Splash Screen Component
  if (showSplashScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-r from-blue-600 to-purple-600 flex flex-col items-center justify-center space-y-6 text-white">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 animate-pulse">
            User Management System
          </h1>
          <p className="text-xl font-light">
            Built with Next.js, TypeScript, Node.js, Express, and MongoDB
          </p>
          
          {/* Technology Logos */}
          <TechLogos />
        </div>
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 via-white to-blue-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md border border-blue-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Admin Login
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Secure Access to User Management System
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg shadow-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 placeholder:text-gray-400"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 pr-16 placeholder:text-gray-400"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none transition duration-300"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white -700 text-center py-3 rounded-lg shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
              </div>
            ) : (
              "Login"
            )}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <a 
                href="/register" 
                className="text-blue-600 hover:text-blue-800 font-semibold transition duration-300"
              >
                Register here
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <a 
                href="/forgot-password" 
                className="hover:text-blue-600 transition duration-300"
              >
                Forgot Password?
              </a>
            </p>
          </div>
        </form>

        {/* Technology Logos */}
        <TechLogos />
      </div>
    </div>
  );
}