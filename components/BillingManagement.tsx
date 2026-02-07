import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, ExternalLink, Download, Calendar } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { getInvoices, getCustomerPortalUrl } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface BillingManagementProps {
  onClose: () => void;
}

interface Invoice {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

const BillingManagement: React.FC<BillingManagementProps> = ({ onClose }) => {
  const { subscription, isPro } = useSubscription();
  const { user: authUser } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    const loadInvoices = async () => {
      if (!authUser) return;
      
      try {
        setIsLoadingInvoices(true);
        const invoiceData = await getInvoices(authUser.uid);
        setInvoices(invoiceData);
      } catch (error) {
        console.error('Error loading invoices:', error);
        toast.error('Failed to load invoice history');
      } finally {
        setIsLoadingInvoices(false);
      }
    };

    loadInvoices();
  }, [authUser]);

  const handleManagePayment = async () => {
    if (!authUser) return;
    
    setIsOpeningPortal(true);
    try {
      const portalUrl = await getCustomerPortalUrl(authUser.uid);
      window.open(portalUrl, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open payment portal. Please try again.');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Assuming amount is in cents
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-secondary/10 text-secondary border-secondary/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-secondary/20">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-secondary hover:text-primary transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold uppercase tracking-wider text-sm">Back to Settings</span>
            </button>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white mb-2">
              Billing & Plan
            </h1>
            <p className="text-secondary text-sm">Manage your billing and plan details</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Current Plan */}
        <div className="bg-gradient-to-br from-surface to-surface/50 border border-secondary/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl">
                <CreditCard size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-wide text-white">
                  {isPro ? 'Professional Plan' : 'Starter Plan'}
                </h2>
                <p className="text-secondary text-sm mt-1">
                  {subscription?.billingCycle && isPro
                    ? `Billed ${subscription.billingCycle}`
                    : 'Free forever'}
                </p>
              </div>
            </div>
            {subscription && (
              <div className="text-right">
                <p className="text-3xl font-black text-primary">
                  {isPro
                    ? subscription.billingCycle === 'monthly'
                      ? '$4'
                      : '$40'
                    : '$0'}
                </p>
                {isPro && (
                  <p className="text-xs text-secondary">
                    {subscription.billingCycle === 'monthly' ? '/month' : '/year'}
                  </p>
                )}
              </div>
            )}
          </div>

          {isPro && subscription?.currentPeriodEnd && (
            <div className="flex items-center gap-2 p-4 bg-background/40 rounded-xl border border-secondary/10 mb-4">
              <Calendar size={16} className="text-secondary" />
              <div className="flex-1">
                <p className="text-xs text-secondary">
                  {subscription.cancelAtPeriodEnd ? 'Access until' : 'Next billing date'}
                </p>
                <p className="text-sm font-bold text-white">
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
          )}

          {subscription?.cancelAtPeriodEnd && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-yellow-400 text-xs font-medium">
                Your subscription is set to cancel at the end of the billing period. You will retain access until then.
              </p>
            </div>
          )}

          <button
            onClick={handleManagePayment}
            disabled={isOpeningPortal || !isPro}
            className="w-full bg-primary hover:bg-cyan-400 text-background font-black uppercase tracking-widest text-sm py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} />
            {isOpeningPortal ? 'Loading...' : 'Manage Plan & Payment'}
          </button>
        </div>

        {/* Payment Method */}
        {isPro && (
          <div className="bg-surface border border-secondary/20 rounded-2xl p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-secondary mb-4">
              Payment Method
            </h2>
            <div className="bg-background/40 border border-secondary/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Payment on file</p>
                  <p className="text-secondary text-xs mt-0.5">Managed through Polar</p>
                </div>
              </div>
              <button
                onClick={handleManagePayment}
                disabled={isOpeningPortal}
                className="text-primary hover:text-cyan-400 font-medium text-sm transition-colors disabled:opacity-50"
              >
                Update
              </button>
            </div>
          </div>
        )}

        {/* Invoice History */}
        {isPro && (
          <div className="bg-surface border border-secondary/20 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-secondary/10">
              <h2 className="text-sm font-black uppercase tracking-wider text-secondary">
                Invoice History
              </h2>
            </div>

            {isLoadingInvoices ? (
              <div className="p-8 text-center">
                <p className="text-secondary text-sm">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-secondary text-sm">No invoices yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="w-full hidden md:table">
                  <thead className="bg-background/40">
                    <tr>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-secondary">
                        Date
                      </th>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-secondary">
                        Amount
                      </th>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-secondary">
                        Status
                      </th>
                      <th className="text-right p-4 text-xs font-black uppercase tracking-wider text-secondary">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-t border-secondary/10 hover:bg-background/40 transition-colors">
                        <td className="p-4 text-sm text-white">{formatDate(invoice.date)}</td>
                        <td className="p-4 text-sm font-bold text-white">{formatAmount(invoice.amount)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {invoice.invoiceUrl && (
                            <a
                              href={invoice.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:text-cyan-400 font-medium text-sm transition-colors"
                            >
                              <Download size={14} />
                              View
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-secondary/10">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="p-4 hover:bg-background/40 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white font-medium">{formatDate(invoice.date)}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-primary">{formatAmount(invoice.amount)}</span>
                        {invoice.invoiceUrl && (
                          <a
                            href={invoice.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:text-cyan-400 font-medium text-xs transition-colors"
                          >
                            <Download size={12} />
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Free Plan CTA */}
        {!isPro && (
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white mb-2">
              Upgrade to Professional
            </h3>
            <p className="text-secondary mb-6">
              Unlock unlimited tasks, AI assistant, team features, and more
            </p>
            <button
              onClick={() => {
                onClose();
                // Navigate to plan page - you might want to use router here
                window.location.href = '/plan';
              }}
              className="bg-primary hover:bg-cyan-400 text-background font-black uppercase tracking-widest text-sm py-3 px-8 rounded-xl transition-all"
            >
              View Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingManagement;
