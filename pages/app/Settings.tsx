import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Image, Mail, Crown, Palette, Sparkles, CreditCard, Lock, LogOut, Trash2, AlertTriangle, Calendar, ExternalLink } from 'lucide-react';
import { UserProfile } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ChangePasswordModal from '../../components/modals/ChangePasswordModal';
import toast from 'react-hot-toast';
import { useSubscription } from '../../hooks/useSubscription';
import { cancelSubscription, getCustomerPortalUrl } from '../../services/subscriptionService';

interface SettingsViewProps {
  user: UserProfile;
  onClose: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'informations' | 'customizations'>('informations');
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const { theme, setTheme } = useTheme();
  const { signOut, deleteAccount, user: authUser } = useAuth();
  const navigate = useNavigate();
  const { subscription, isLoading: isSubscriptionLoading, isPro } = useSubscription();

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      setDeleteStep(0);
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setIsDeleting(false);
    }
  };

  const handleUpgradePlan = () => {
    onClose();
    navigate('/plan');
  };

  const handleManageBilling = async () => {
    if (!authUser) return;
    
    setIsLoadingPortal(true);
    try {
      const portalUrl = await getCustomerPortalUrl(authUser.uid);
      window.open(portalUrl, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open billing portal. Please try again.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!authUser || !subscription) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will retain Pro access until the end of your billing period.'
    );
    
    if (!confirmed) return;
    
    setIsCanceling(true);
    try {
      await cancelSubscription(authUser.uid);
      toast.success('Subscription canceled. You will retain access until the end of your billing period.');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-surface border border-secondary/20 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-secondary/10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Settings</h2>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-white transition-colors p-2 hover:bg-secondary/10 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 px-8 pt-6 border-b border-secondary/10">
          <button
            onClick={() => setActiveTab('informations')}
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'informations' 
                ? 'text-primary border-primary' 
                : 'text-secondary border-transparent hover:text-white'
            }`}
          >
            Informations
          </button>
          <button
            onClick={() => setActiveTab('customizations')}
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'customizations' 
                ? 'text-primary border-primary' 
                : 'text-secondary border-transparent hover:text-white'
            }`}
          >
            Customizations
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'informations' && (
            <div className="space-y-8">
              {/* Email Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <Mail size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Email</span>
                </div>
                <div className="bg-background border border-secondary/20 rounded-xl p-4">
                  <p className="text-white">user@xpeak.com</p>
                  <p className="text-secondary text-xs mt-1">Your account email address</p>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <Lock size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Password</span>
                </div>
                <button 
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="w-full bg-background border border-secondary/20 rounded-xl p-4 text-left hover:bg-surface transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium group-hover:text-primary transition-colors">Change Password</p>
                      <p className="text-secondary text-xs mt-1">Update your account password</p>
                    </div>
                    <div className="text-secondary group-hover:text-primary transition-colors">→</div>
                  </div>
                </button>
              </div>

              {/* Plan Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <Crown size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Subscription</span>
                </div>
                
                {isSubscriptionLoading ? (
                  <div className="bg-background border border-secondary/20 rounded-xl p-4">
                    <p className="text-secondary text-sm">Loading subscription...</p>
                  </div>
                ) : subscription ? (
                  <div className="bg-gradient-to-br from-surface to-surface/50 border border-secondary/20 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-black uppercase tracking-wide ${isPro ? 'text-primary' : 'text-white'}`}>
                          {subscription.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                        </p>
                        {subscription.billingCycle && (
                          <p className="text-secondary text-xs mt-1 capitalize">
                            Billed {subscription.billingCycle}
                          </p>
                        )}
                      </div>
                      {!isPro && (
                        <button 
                          onClick={handleUpgradePlan}
                          className="bg-primary hover:bg-cyan-400 text-background font-black uppercase tracking-widest text-xs py-2 px-4 rounded-lg transition-all"
                        >
                          Upgrade
                        </button>
                      )}
                    </div>

                    {isPro && subscription.currentPeriodEnd && (
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar size={16} className="text-secondary mt-0.5" />
                        <div>
                          <p className="text-gray-300">
                            {subscription.cancelAtPeriodEnd ? 'Access until' : 'Renews on'}
                          </p>
                          <p className="text-white font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
                        </div>
                      </div>
                    )}

                    {isPro && subscription.cancelAtPeriodEnd && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-400 text-xs font-medium">
                          Your subscription is canceled and will not renew. You will retain Pro access until the end of your billing period.
                        </p>
                      </div>
                    )}

                    {isPro && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button 
                          onClick={handleManageBilling}
                          disabled={isLoadingPortal}
                          className="flex-1 flex items-center justify-center gap-2 bg-background border border-secondary/20 hover:bg-surface text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
                        >
                          <ExternalLink size={16} />
                          {isLoadingPortal ? 'Loading...' : 'Billing Portal'}
                        </button>
                        {!subscription.cancelAtPeriodEnd && (
                          <button 
                            onClick={handleCancelSubscription}
                            disabled={isCanceling}
                            className="flex-1 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-medium text-sm py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
                          >
                            {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Manage Billing Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <CreditCard size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Manage Billing</span>
                </div>
                <button 
                  onClick={handleManageBilling}
                  className="w-full bg-background border border-secondary/20 rounded-xl p-4 text-left hover:bg-surface transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium group-hover:text-primary transition-colors">Payment & Subscription</p>
                      <p className="text-secondary text-xs mt-1">Update payment methods</p>
                    </div>
                    <div className="text-secondary group-hover:text-primary transition-colors">→</div>
                  </div>
                </button>
              </div>

              {/* Logout Section */}
              <div className="pt-4 border-t border-secondary/10 space-y-3">
                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left hover:bg-red-500/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={20} className="text-red-400" />
                    <div>
                      <p className="text-red-400 font-medium group-hover:text-red-300 transition-colors">Log Out</p>
                      <p className="text-secondary text-xs mt-1">Sign out of your account</p>
                    </div>
                  </div>
                </button>

                {/* Delete Account Button */}
                <button 
                  onClick={() => setDeleteStep(1)}
                  className="w-full bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-left hover:bg-red-900/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 size={20} className="text-red-500" />
                    <div>
                      <p className="text-red-500 font-medium group-hover:text-red-400 transition-colors">Delete Account</p>
                      <p className="text-secondary text-xs mt-1">Permanently delete your account and all data</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'customizations' && (
            <div className="space-y-8">
              {/* Profile Picture */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <User size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Profile Picture</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-surface border-2 border-primary/40 flex items-center justify-center relative group cursor-pointer">
                    <User size={40} className="text-primary" />
                    <button className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Image size={24} className="text-white" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{user.name}</h3>
                    <p className="text-secondary text-sm">Level {user.level} • {user.totalXP} XP</p>
                    <p className="text-secondary text-xs mt-2">Click to upload new profile picture</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-secondary/10 my-6"></div>

              {/* Theme Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <Palette size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Theme</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`bg-background rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-surface transition-colors ${
                      theme === 'dark' ? 'border-2 border-primary/40' : 'border border-secondary/20'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900"></div>
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary'}`}>Dark</span>
                  </button>
                  <button 
                    onClick={() => setTheme('light')}
                    className={`bg-background rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-surface transition-colors ${
                      theme === 'light' ? 'border-2 border-primary/40' : 'border border-secondary/20'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-50 to-slate-200"></div>
                    <span className={`text-xs font-medium ${theme === 'light' ? 'text-white' : 'text-secondary'}`}>Light</span>
                  </button>
                </div>
              </div>

              {/* Presets AI Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <Sparkles size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">AI Settings</span>
                </div>
                <button className="w-full bg-background border border-secondary/20 rounded-xl p-4 text-left hover:bg-surface transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium group-hover:text-primary transition-colors">Configure AI Preferences</p>
                      <p className="text-secondary text-xs mt-1">Customize assistant behavior</p>
                    </div>
                    <div className="text-secondary group-hover:text-primary transition-colors">→</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* First Delete Confirmation Modal */}
      {deleteStep === 1 && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface border border-red-500/30 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden shadow-red-500/10">
            <div className="flex items-center justify-between p-4 border-b border-red-500/10 bg-red-500/5">
              <h3 className="font-black text-red-500 uppercase tracking-widest text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> Delete Account
              </h3>
              <button onClick={() => setDeleteStep(0)} className="text-secondary hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 text-center">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic mb-3">Are you sure?</h2>
              <p className="text-secondary text-sm font-medium mb-6 leading-relaxed">
                You are about to delete your account. This action is <span className="text-red-400 font-bold">permanent</span> and cannot be undone.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setDeleteStep(2)} 
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  Continue
                </button>
                <button 
                  onClick={() => setDeleteStep(0)} 
                  className="w-full bg-surface border border-secondary/30 text-secondary hover:text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Second Delete Confirmation Modal */}
      {deleteStep === 2 && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface border border-red-500/30 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden shadow-red-500/10">
            <div className="flex items-center justify-between p-4 border-b border-red-500/10 bg-red-500/5">
              <h3 className="font-black text-red-500 uppercase tracking-widest text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> Final Warning
              </h3>
              <button onClick={() => setDeleteStep(0)} className="text-secondary hover:text-white transition-colors" disabled={isDeleting}>
                <X size={18} />
              </button>
            </div>
            <div className="p-6 text-center">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic mb-3">This cannot be undone!</h2>
              <p className="text-secondary text-sm font-medium mb-4 leading-relaxed">
                All your data will be <span className="text-red-400 font-bold">permanently deleted</span>:
              </p>
              <ul className="text-left text-secondary text-sm mb-6 space-y-1 pl-4">
                <li>• Your profile and settings</li>
                <li>• All tasks and quests</li>
                <li>• Your XP and progress</li>
                <li>• Friends and challenges</li>
              </ul>
              <p className="text-red-400 text-xs font-bold mb-6">
                You will not be able to recover this account or log in with this email again.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={18} />
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </button>
                <button 
                  onClick={() => setDeleteStep(0)}
                  disabled={isDeleting}
                  className="w-full bg-surface border border-secondary/30 text-secondary hover:text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export default SettingsView;

