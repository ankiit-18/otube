import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GraduationCap, User, Mail, Calendar, ArrowLeft } from 'lucide-react';

export function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate('/login');
      }
      setLoading(false);
    };

    getUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Your Profile
              </h1>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {user.user_metadata?.full_name || 'User'}
                </h2>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Email Verified</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    user.email_confirmed_at 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.email_confirmed_at ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Authentication Provider</span>
                  <span className="text-gray-900 font-medium capitalize">
                    {user.app_metadata?.provider || 'Email'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Sign In</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(user.last_sign_in_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Stats Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Statistics</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
                <div className="text-sm text-gray-600">Videos Processed</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">0</div>
                <div className="text-sm text-gray-600">Questions Answered</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-600 mb-1">0</div>
                <div className="text-sm text-gray-600">Total Study Time</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              **Note**: Statistics tracking coming soon!
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleSignOut}
              className="flex-1 py-3 px-4 rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
