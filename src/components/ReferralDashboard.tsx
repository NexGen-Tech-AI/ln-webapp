import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Copy, Users, Gift, Clock, Check } from 'lucide-react';

interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  total_credits: number;
  used_credits: number;
  available_credits: number;
  next_reward_at: number;
}

export const ReferralDashboard: React.FC = () => {
  const { user } = useAuth();
  const [referralLink, setReferralLink] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get referral link
      const { data: linkData, error: linkError } = await supabase
        .rpc('generate_secure_referral_link', { user_id: user!.id });

      if (linkError) throw linkError;
      setReferralLink(linkData);

      // Get referral stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_referral_stats', { user_id: user!.id });

      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }
    } catch (err) {
      console.error('Error fetching referral data:', err);
      setError('Failed to load referral information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Link Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
          />
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Share this link with friends to earn rewards when they sign up!
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Referrals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_referrals}</p>
              </div>
            </div>
          </div>

          {/* Successful Referrals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.successful_referrals}</p>
              </div>
            </div>
          </div>

          {/* Available Credits */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Credits</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.available_credits}</p>
              </div>
            </div>
          </div>

          {/* Next Reward */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Reward In</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.next_reward_at}</p>
                <p className="text-xs text-gray-500">referrals</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Stats */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Credits Earned</span>
              <span className="text-sm font-medium text-gray-900">{stats.total_credits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Credits Used</span>
              <span className="text-sm font-medium text-gray-900">{stats.used_credits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Referrals</span>
              <span className="text-sm font-medium text-gray-900">{stats.pending_referrals}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Available to Use</span>
                <span className="text-lg font-semibold text-indigo-600">{stats.available_credits}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Explanation */}
      <div className="bg-indigo-50 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-indigo-900 mb-2">How Rewards Work</h4>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>• Earn credits when your referrals sign up and subscribe</li>
          <li>• Credits can be used for premium features or discounts</li>
          <li>• Different user types have different reward thresholds</li>
          <li>• Credits expire 30 days after being earned</li>
        </ul>
      </div>
    </div>
  );
};