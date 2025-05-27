
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const AuthChecker: React.FC = () => {
  const [authData, setAuthData] = useState<any>(null);
  const [orgData, setOrgData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Check auth.getUser()
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      console.log('Auth user:', authUser, 'Error:', authError);
      
      // Check auth.getSession()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session:', sessionData, 'Error:', sessionError);
      
      // Check profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.user?.id || 'none')
        .single();
      console.log('Profile:', profile, 'Error:', profileError);
      
      // Check organization_users table
      const { data: orgUsers, error: orgError } = await supabase
        .from('organization_users')
        .select('*')
        .eq('user_id', authUser.user?.id || 'none');
      console.log('Organization users:', orgUsers, 'Error:', orgError);
      
      setAuthData({
        user: authUser.user,
        authError,
        session: sessionData.session,
        sessionError
      });
      
      setProfileData({
        profile,
        profileError
      });
      
      setOrgData({
        orgUsers,
        orgError
      });
      
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Checker
        </CardTitle>
        <CardDescription>
          Debug your authentication and user access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Button onClick={checkAuth} disabled={loading}>
            {loading ? 'Checking...' : 'Refresh Auth Status'}
          </Button>
          
          {/* Auth Context Status */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Auth Context Status
            </h3>
            <div className="bg-gray-50 p-3 rounded">
              <p>User ID: {user?.id || 'None'}</p>
              <p>Email: {user?.email || 'None'}</p>
              <p>Session exists: {session ? '✓' : '✗'}</p>
            </div>
          </div>

          {/* Supabase Auth Status */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Supabase Auth Status
            </h3>
            <div className="bg-gray-50 p-3 rounded">
              {authData ? (
                <>
                  <p>User ID: {authData.user?.id || 'None'}</p>
                  <p>Email: {authData.user?.email || 'None'}</p>
                  <p>Auth Error: {authData.authError ? authData.authError.message : 'None'}</p>
                  <p>Session exists: {authData.session ? '✓' : '✗'}</p>
                  <p>Session Error: {authData.sessionError ? authData.sessionError.message : 'None'}</p>
                </>
              ) : (
                <p>Click "Refresh Auth Status" to check</p>
              )}
            </div>
          </div>

          {/* Profile Status */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile Status
            </h3>
            <div className="bg-gray-50 p-3 rounded">
              {profileData ? (
                <>
                  <p>Profile exists: {profileData.profile ? '✓' : '✗'}</p>
                  <p>Profile Error: {profileData.profileError ? profileData.profileError.message : 'None'}</p>
                  {profileData.profile && (
                    <>
                      <p>Full Name: {profileData.profile.full_name || 'None'}</p>
                      <p>Email: {profileData.profile.email || 'None'}</p>
                    </>
                  )}
                </>
              ) : (
                <p>Click "Refresh Auth Status" to check</p>
              )}
            </div>
          </div>

          {/* Organization Access */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Organization Access
            </h3>
            <div className="bg-gray-50 p-3 rounded">
              {orgData ? (
                <>
                  <p>Organizations: {orgData.orgUsers?.length || 0}</p>
                  <p>Org Error: {orgData.orgError ? orgData.orgError.message : 'None'}</p>
                  {orgData.orgUsers && orgData.orgUsers.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Organization memberships:</p>
                      {orgData.orgUsers.map((ou: any, idx: number) => (
                        <p key={idx} className="text-sm">
                          • Org ID: {ou.organization_id}, Role: {ou.role}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p>Click "Refresh Auth Status" to check</p>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Status Summary</h3>
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Authenticated</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Not authenticated</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthChecker;
